import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type {
  PaymentStatus,
  PlacedOrder,
  PublicTrackedOrder,
  TrackQueryKind,
} from "@/lib/orders";
import { TRACK_SENTINEL_ID, toPublicTrackedOrder, uniquePhoneVariants } from "@/lib/orders";
import { PRODUCT } from "@/lib/product";

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

export async function markOrderPaidAdmin(input: {
  order: PlacedOrder;
  razorpayOrderId: string;
  razorpayPaymentId: string;
}): Promise<void> {
  const db = getFirestore(getFirebaseAdminApp());
  const ref = db.collection("orders").doc(input.order.orderId);
  const now = new Date().toISOString();

  const snap = await ref.get();
  const base = {
    ...input.order,
    productId: PRODUCT.id,
    productName: PRODUCT.name,
    source: "ickdeath-website",
    paymentStatus: "paid" as const,
    orderStatus: input.order.orderStatus ?? "confirmed",
    razorpayOrderId: input.razorpayOrderId,
    razorpayPaymentId: input.razorpayPaymentId,
    updatedAt: now,
  };

  if (snap.exists) {
    await ref.update({
      paymentStatus: "paid",
      paymentMethod: input.order.paymentMethod,
      razorpayOrderId: input.razorpayOrderId,
      razorpayPaymentId: input.razorpayPaymentId,
      updatedAt: now,
    });
  } else {
    await ref.set({
      ...base,
      createdAt: input.order.createdAt,
    });
  }
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
