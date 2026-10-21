import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import type {
  OrderStatus,
  PaymentStatus,
  PlacedOrder,
  PublicTrackedOrder,
  TrackQueryKind,
  WhatsAppOrderEvent,
  WhatsAppSendStatus,
} from "@/lib/orders";
import { TRACK_SENTINEL_ID, toPublicTrackedOrder, uniquePhoneVariants } from "@/lib/orders";
import { formatOrderItems, PRODUCT } from "@/lib/product";

export function isFirebaseAdminConfigured(): boolean {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim();
  if (!projectId || !clientEmail || !privateKey) return false;
  // Placeholder / incomplete keys from .env.example
  if (privateKey.includes("...") || !privateKey.includes("BEGIN")) return false;
  return true;
}

function normalizePrivateKey(raw: string): string {
  let key = raw.trim();
  // Strip wrapping quotes from .env values
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  // Convert escaped newlines from single-line env vars
  key = key.replace(/\\n/g, "\n");
  return key.trim();
}

export function getFirebaseAdminApp(): App {
  if (!isFirebaseAdminConfigured()) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY.",
    );
  }

  const existing = getApps()[0];
  if (existing) return existing;

  const privateKey = normalizePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY!);

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

const HDFC_PAYMENTS = "hdfcPayments";
const HDFC_TXN_IDS = "hdfcTxnIds";

export type HdfcAttemptResult =
  | "paid"
  | "pending"
  | "failed"
  | "cancelled"
  | "mismatch"
  | "duplicate";

export type ReserveHdfcPaymentResult =
  | { ok: true }
  | { ok: false; reason: "exists" | "paid" | "missing" };

/** Create the gateway order row once. A colliding id is not overwritten. */
export async function saveHdfcPaymentAdmin(input: {
  hdfcOrderId: string;
  orderId: string;
  amountPaise: number;
}): Promise<ReserveHdfcPaymentResult> {
  const db = getFirestore(getFirebaseAdminApp());
  let outcome: ReserveHdfcPaymentResult = { ok: false, reason: "missing" };

  await db.runTransaction(async (tx) => {
    const paymentRef = db.collection(HDFC_PAYMENTS).doc(input.hdfcOrderId);
    const orderRef = db.collection("orders").doc(input.orderId);
    const paymentSnap = await tx.get(paymentRef);
    const orderSnap = await tx.get(orderRef);

    if (paymentSnap.exists) {
      outcome = { ok: false, reason: "exists" };
      return;
    }
    if (!orderSnap.exists) {
      outcome = { ok: false, reason: "missing" };
      return;
    }
    if (orderSnap.data()?.paymentStatus === "paid") {
      outcome = { ok: false, reason: "paid" };
      return;
    }

    const now = new Date().toISOString();
    tx.set(paymentRef, {
      hdfcOrderId: input.hdfcOrderId,
      orderId: input.orderId,
      amountPaise: input.amountPaise,
      createdAt: now,
    });
    tx.update(orderRef, {
      hdfcOrderId: input.hdfcOrderId,
      paymentMethod: "hdfc",
      paymentStatus: "pending",
      amountPaise: input.amountPaise,
      hdfcResult: "pending",
      updatedAt: now,
    });
    outcome = { ok: true };
  });

  return outcome;
}

type GatewayWrite = {
  orderId: string;
  hdfcOrderId: string;
  txnId: string;
  gatewayStatus: string;
  gatewayAmountPaise: number | null;
  result: HdfcAttemptResult;
  orderIdMatched: boolean;
  amountMatched: boolean;
};

function gatewayDoc(input: GatewayWrite, now: string) {
  return {
    status: input.gatewayStatus,
    txnId: input.txnId,
    gatewayAmountPaise: input.gatewayAmountPaise,
    result: input.result,
    orderIdMatched: input.orderIdMatched,
    amountMatched: input.amountMatched,
    storedAt: now,
  };
}

/**
 * Mark a charge paid only when this transaction id and gateway order id are new
 * or already stored for the same order. A second id does not create a receipt.
 */
export async function finalizeHdfcPaidAdmin(input: {
  order: PlacedOrder;
  hdfcOrderId: string;
  txnId: string;
  gatewayStatus: string;
  gatewayAmountPaise: number;
}): Promise<"created" | "already" | "duplicate"> {
  const db = getFirestore(getFirebaseAdminApp());
  const now = new Date().toISOString();
  const orderRef = db.collection("orders").doc(input.order.orderId);
  const paymentRef = db.collection(HDFC_PAYMENTS).doc(input.hdfcOrderId);
  const txnRef = input.txnId ? db.collection(HDFC_TXN_IDS).doc(input.txnId) : null;
  let outcome: "created" | "already" | "duplicate" = "duplicate";

  await db.runTransaction(async (tx) => {
    const orderSnap = await tx.get(orderRef);
    const txnSnap = txnRef ? await tx.get(txnRef) : null;
    const orderData = orderSnap.data();
    const paid = orderData?.paymentStatus === "paid";
    const sameGateway = orderData?.hdfcOrderId === input.hdfcOrderId;
    const sameTxn =
      !input.txnId || !orderData?.hdfcTxnId || orderData.hdfcTxnId === input.txnId;

    const response = gatewayDoc(
      {
        orderId: input.order.orderId,
        hdfcOrderId: input.hdfcOrderId,
        txnId: input.txnId,
        gatewayStatus: input.gatewayStatus,
        gatewayAmountPaise: input.gatewayAmountPaise,
        result: "paid",
        orderIdMatched: true,
        amountMatched: true,
      },
      now,
    );

    if (txnSnap?.exists) {
      const ownerOrder = String(txnSnap.data()?.orderId ?? "");
      const ownerGateway = String(txnSnap.data()?.hdfcOrderId ?? "");
      const foreign =
        (ownerOrder && ownerOrder !== input.order.orderId) ||
        (ownerGateway && ownerGateway !== input.hdfcOrderId);
      if (foreign) {
        tx.set(paymentRef, { ...response, result: "duplicate" }, { merge: true });
        outcome = "duplicate";
        return;
      }
    }

    if (paid && (!sameGateway || !sameTxn)) {
      tx.set(paymentRef, { ...response, result: "duplicate" }, { merge: true });
      outcome = "duplicate";
      return;
    }

    if (paid && sameGateway && sameTxn) {
      tx.set(paymentRef, response, { merge: true });
      outcome = "already";
      return;
    }

    const gateway = {
      paymentMethod: "hdfc" as const,
      paymentStatus: "paid" as const,
      hdfcOrderId: input.hdfcOrderId,
      hdfcStatus: input.gatewayStatus,
      hdfcAmountPaise: input.gatewayAmountPaise,
      hdfcResult: "paid" as const,
      ...(input.txnId ? { hdfcTxnId: input.txnId } : {}),
      updatedAt: now,
    };

    if (orderSnap.exists) {
      tx.update(orderRef, gateway);
    } else {
      tx.set(orderRef, {
        ...input.order,
        ...gateway,
        productId: PRODUCT.id,
        productName: formatOrderItems(input.order),
        source: "ickdeath-website",
        orderStatus: input.order.orderStatus ?? "confirmed",
        createdAt: input.order.createdAt,
      });
    }

    tx.set(paymentRef, response, { merge: true });
    if (txnRef && input.txnId) {
      const txnRecord = {
        txnId: input.txnId,
        orderId: input.order.orderId,
        hdfcOrderId: input.hdfcOrderId,
        amountPaise: input.gatewayAmountPaise,
        createdAt: now,
      };
      if (txnSnap?.exists) tx.set(txnRef, txnRecord, { merge: true });
      else tx.create(txnRef, txnRecord);
    }
    outcome = "created";
  });

  return outcome;
}

/** Store a non-paid status response. Never downgrades an order that is already paid. */
export async function recordHdfcAttemptAdmin(input: GatewayWrite): Promise<void> {
  const db = getFirestore(getFirebaseAdminApp());
  const now = new Date().toISOString();
  const paymentRef = db.collection(HDFC_PAYMENTS).doc(input.hdfcOrderId);
  const orderRef = db.collection("orders").doc(input.orderId);

  await paymentRef.set(gatewayDoc(input, now), { merge: true });

  const snap = await orderRef.get();
  if (!snap.exists) return;
  const data = snap.data();
  if (data?.paymentStatus === "paid") return;
  const currentGateway = String(data?.hdfcOrderId ?? "");
  if (currentGateway && currentGateway !== input.hdfcOrderId) return;

  await orderRef.update({
    paymentStatus: input.result === "pending" ? "pending" : "failed",
    hdfcOrderId: input.hdfcOrderId,
    hdfcStatus: input.gatewayStatus,
    hdfcResult: input.result,
    ...(input.txnId ? { hdfcTxnId: input.txnId } : {}),
    ...(input.gatewayAmountPaise != null
      ? { hdfcAmountPaise: input.gatewayAmountPaise }
      : {}),
    updatedAt: now,
  });
}

export async function getHdfcPaymentAdmin(hdfcOrderId: string): Promise<{
  orderId: string;
  amountPaise: number;
} | null> {
  const db = getFirestore(getFirebaseAdminApp());
  const snap = await db.collection(HDFC_PAYMENTS).doc(hdfcOrderId).get();
  if (!snap.exists) return null;
  const data = snap.data();
  const orderId = String(data?.orderId ?? "");
  const amountPaise = Number(data?.amountPaise ?? 0);
  if (!orderId || !Number.isFinite(amountPaise)) return null;
  return { orderId, amountPaise };
}

/** Auto-set payment status (e.g. failed). Never downgrades a paid order. */
export async function markOrderPaymentStatusAdmin(input: {
  orderId: string;
  paymentStatus: PaymentStatus;
}): Promise<void> {
  if (!isFirebaseAdminConfigured()) return;

  const db = getFirestore(getFirebaseAdminApp());
  const ref = db.collection("orders").doc(input.orderId);
  const snap = await ref.get();
  if (!snap.exists) return;

  const current = snap.data()?.paymentStatus;
  if (current === "paid") return;

  await ref.update({
    paymentStatus: input.paymentStatus,
    updatedAt: new Date().toISOString(),
  });
}

export async function findOrdersForTracking(
  query: TrackQueryKind,
): Promise<PublicTrackedOrder[]> {
  const db = getFirestore(getFirebaseAdminApp());

  if (query.kind === "orderId") {
    if (query.orderId === TRACK_SENTINEL_ID) return [];
    const snap = await db.collection("orders").doc(query.orderId).get();
    if (!snap.exists) return [];
    return [toPublicTrackedOrder(snap.data()!)];
  }

  const byId = new Map<string, PublicTrackedOrder>();
  const snaps = await Promise.all(
    uniquePhoneVariants(query.phone).map((variant) =>
      db.collection("orders").where("contact.phone", "==", variant).limit(20).get(),
    ),
  );

  for (const snap of snaps) {
    for (const docSnap of snap.docs) {
      if (docSnap.id === TRACK_SENTINEL_ID) continue;
      const order = toPublicTrackedOrder(docSnap.data());
      if (order.orderId) byId.set(order.orderId, order);
    }
  }

  return [...byId.values()].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );
}

const FIREBASE_CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

let firebaseCerts: { keys: Record<string, string>; expiresAt: number } | null = null;

async function firebasePublicCerts(): Promise<Record<string, string>> {
  if (firebaseCerts && firebaseCerts.expiresAt > Date.now()) return firebaseCerts.keys;
  const response = await fetch(FIREBASE_CERTS_URL);
  if (!response.ok) throw new Error("Could not load Firebase public keys");
  const keys = (await response.json()) as Record<string, string>;
  const maxAge = Number(/max-age=(\d+)/.exec(response.headers.get("cache-control") ?? "")?.[1] ?? 3600);
  firebaseCerts = { keys, expiresAt: Date.now() + maxAge * 1000 };
  return keys;
}

/**
 * Verify a Firebase ID token without firebase-admin/auth.
 * That entry loads jwks-rsa, which require()s the ESM-only jose package and
 * crashes the Vercel function before checkout can respond.
 */
export async function verifyAdminIdToken(idToken: string) {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim();
  if (!projectId) {
    throw new Error("Firebase Admin is not configured");
  }

  const { decodeProtectedHeader, importX509, jwtVerify } = await import("jose");
  const kid = decodeProtectedHeader(idToken).kid;
  if (!kid) throw new Error("Invalid admin token");
  const cert = (await firebasePublicCerts())[kid];
  if (!cert) throw new Error("Invalid admin token");

  const { payload } = await jwtVerify(idToken, await importX509(cert, "RS256"), {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
    clockTolerance: 5,
  });
  if (typeof payload.sub !== "string" || !payload.sub) {
    throw new Error("Invalid admin token");
  }
  return payload;
}

export async function getOrderAdmin(orderId: string): Promise<PlacedOrder | null> {
  const db = getFirestore(getFirebaseAdminApp());
  const snap = await db.collection("orders").doc(orderId).get();
  if (!snap.exists) return null;
  return snap.data() as PlacedOrder;
}

export async function updateOrderStatusesAdmin(input: {
  orderId: string;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
}): Promise<PlacedOrder> {
  const db = getFirestore(getFirebaseAdminApp());
  const ref = db.collection("orders").doc(input.orderId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error("Order not found");
  }

  const patch: Record<string, string> = {
    updatedAt: new Date().toISOString(),
  };
  if (input.orderStatus) patch.orderStatus = input.orderStatus;
  if (input.paymentStatus) patch.paymentStatus = input.paymentStatus;
  await ref.update(patch);

  const next = await ref.get();
  return next.data() as PlacedOrder;
}

export async function recordWhatsAppOnOrderAdmin(input: {
  orderId: string;
  event: WhatsAppOrderEvent;
  template?: string;
  messageId?: string;
  status: WhatsAppSendStatus;
  error?: string;
}): Promise<void> {
  const db = getFirestore(getFirebaseAdminApp());
  const ref = db.collection("orders").doc(input.orderId);
  const now = new Date().toISOString();
  const snap = await ref.get();
  if (!snap.exists) return;

  const update: Record<string, unknown> = {
    updatedAt: now,
    "whatsapp.lastEvent": input.event,
    "whatsapp.lastTemplate": input.template ?? "",
    "whatsapp.lastMessageId": input.messageId ?? "",
    "whatsapp.lastSentAt": now,
    "whatsapp.lastStatus": input.status,
    "whatsapp.lastError": input.error ?? "",
  };
  if (input.status !== "failed") {
    update["whatsapp.eventsSent"] = FieldValue.arrayUnion(input.event);
  }
  await ref.update(update);

  if (input.messageId) {
    await db.collection("whatsappMessages").doc(input.messageId).set({
      orderId: input.orderId,
      event: input.event,
      createdAt: now,
    });
  }
}

export async function recordWhatsAppDeliveryStatusAdmin(input: {
  messageId: string;
  status: WhatsAppSendStatus;
}): Promise<void> {
  const db = getFirestore(getFirebaseAdminApp());
  const map = await db.collection("whatsappMessages").doc(input.messageId).get();
  const orderId = map.data()?.orderId as string | undefined;
  if (!orderId) return;

  const ref = db.collection("orders").doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) return;

  await ref.update({
    updatedAt: new Date().toISOString(),
    "whatsapp.lastMessageId": input.messageId,
    "whatsapp.lastStatus": input.status,
  });
}

export async function claimWhatsAppInboundAdmin(messageId: string): Promise<boolean> {
  const db = getFirestore(getFirebaseAdminApp());
  try {
    await db.collection("whatsappInbound").doc(messageId).create({
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch {
    return false;
  }
}

export async function getWhatsAppSessionAdmin(waId: string): Promise<{
  autoReply: boolean;
} | null> {
  const db = getFirestore(getFirebaseAdminApp());
  const snap = await db.collection("whatsappSessions").doc(waId).get();
  if (!snap.exists) return null;
  const autoReply = snap.data()?.autoReply !== false;
  return { autoReply };
}

export async function setWhatsAppSessionAdmin(input: {
  waId: string;
  autoReply: boolean;
}): Promise<void> {
  const db = getFirestore(getFirebaseAdminApp());
  await db.collection("whatsappSessions").doc(input.waId).set(
    {
      autoReply: input.autoReply,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}
