import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { PRODUCT } from "@/lib/product";
import {
  TRACK_SENTINEL_ID,
  toPublicTrackedOrder,
  uniquePhoneVariants,
  type OrderStatus,
  type PaymentStatus,
  type PlacedOrder,
  type PublicTrackedOrder,
  type TrackQueryKind,
} from "@/lib/orders";

export const ORDERS_COLLECTION = "orders";
export const PHONE_INDEX_COLLECTION = "phoneIndex";

export type OrderRecord = PlacedOrder & {
  productId: string;
  productName: string;
  source: string;
  updatedAt: string;
};

function toOrderRecord(data: DocumentData): OrderRecord {
  return data as OrderRecord;
}

export async function createOrderInFirestore(
  order: PlacedOrder,
): Promise<OrderRecord> {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase is not configured");
  }

  const record: OrderRecord = {
    ...order,
    productId: PRODUCT.id,
    productName: PRODUCT.name,
    source: "ickdeath-website",
    updatedAt: order.createdAt,
  };

  const db = getFirebaseDb();
  const ref = doc(db, ORDERS_COLLECTION, order.orderId);
  await setDoc(ref, record);

  const phone = order.contact.phone.replace(/\D/g, "");
  if (phone) {
    await setDoc(doc(db, PHONE_INDEX_COLLECTION, phone, "orders", order.orderId), {
      orderId: order.orderId,
      createdAt: order.createdAt,
    });
  }

  return record;
}

export function subscribeOrders(
  onData: (orders: OrderRecord[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  if (!isFirebaseConfigured()) {
    onError(new Error("Firebase is not configured"));
    return () => {};
  }

  const q = query(
    collection(getFirebaseDb(), ORDERS_COLLECTION),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs
          .map((d) => toOrderRecord(d.data()))
          .filter((order) => order.orderId !== TRACK_SENTINEL_ID),
      );
    },
    (err) => {
      onError(err);
    },
  );
}

export async function getOrderFromFirestore(
  orderId: string,
): Promise<OrderRecord | null> {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase is not configured");
  }

  const snap = await getDoc(doc(getFirebaseDb(), ORDERS_COLLECTION, orderId));
  if (!snap.exists()) return null;
  return toOrderRecord(snap.data());
}

export async function updateOrderStatuses(input: {
  orderId: string;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
}): Promise<void> {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase is not configured");
  }

  const patch: Record<string, string> = {
    updatedAt: new Date().toISOString(),
  };
  if (input.orderStatus) patch.orderStatus = input.orderStatus;
  if (input.paymentStatus) patch.paymentStatus = input.paymentStatus;

  await updateDoc(doc(getFirebaseDb(), ORDERS_COLLECTION, input.orderId), patch);
}

export async function findOrdersForTrackingClient(
  queryKind: TrackQueryKind,
): Promise<PublicTrackedOrder[]> {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase is not configured");
  }

  const db = getFirebaseDb();

  if (queryKind.kind === "orderId") {
    if (queryKind.orderId === TRACK_SENTINEL_ID) return [];
    const snap = await getDoc(doc(db, ORDERS_COLLECTION, queryKind.orderId));
    if (!snap.exists()) return [];
    return [toPublicTrackedOrder(snap.data())];
  }

  await ensureTrackSentinel();

  const byId = new Map<string, PublicTrackedOrder>();

  const variantSnaps = await Promise.all(
    uniquePhoneVariants(queryKind.phone).map(async (variant) => {
      try {
        return await getDocs(
          query(
            collection(db, ORDERS_COLLECTION),
            where("contact.phone", "==", variant),
            limit(20),
          ),
        );
      } catch {
        return null;
      }
    }),
  );

  for (const snap of variantSnaps) {
    if (!snap) continue;
    for (const item of snap.docs) {
      if (item.id === TRACK_SENTINEL_ID) continue;
      const order = toPublicTrackedOrder(item.data());
      if (order.orderId) byId.set(order.orderId, order);
    }
  }

  const phoneQueryBlocked = variantSnaps.every((snap) => snap === null);

  try {
    const indexSnap = await getDocs(
      collection(db, PHONE_INDEX_COLLECTION, queryKind.phone, "orders"),
    );
    const indexed = await Promise.all(
      indexSnap.docs.map(async (entry) => {
        const snap = await getDoc(doc(db, ORDERS_COLLECTION, entry.id));
        if (!snap.exists()) return null;
        return toPublicTrackedOrder(snap.data());
      }),
    );
    for (const order of indexed) {
      if (order?.orderId) byId.set(order.orderId, order);
    }
  } catch {
    // phoneIndex is optional when the orders query succeeds.
  }

  if (byId.size === 0 && phoneQueryBlocked) {
    throw new Error("Could not look up your order");
  }

  return [...byId.values()].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );
}

async function ensureTrackSentinel(): Promise<void> {
  const db = getFirebaseDb();
  const ref = doc(db, ORDERS_COLLECTION, TRACK_SENTINEL_ID);
  try {
    const existing = await getDoc(ref);
    if (existing.exists()) return;
    await setDoc(ref, {
      orderId: TRACK_SENTINEL_ID,
      createdAt: "1970-01-01T00:00:00.000Z",
      contact: { name: "", phone: "", email: "" },
      address: {
        line1: "",
        line2: "",
        pincode: "000000",
        city: "",
        state: "",
      },
      quantity: 1,
      amountPaise: 0,
      paymentMethod: "razorpay",
      paymentStatus: "pending",
      orderStatus: "confirmed",
      productId: PRODUCT.id,
      productName: PRODUCT.name,
      source: "track-sentinel",
      updatedAt: "1970-01-01T00:00:00.000Z",
    });
  } catch {
    // Sentinel is best-effort; phone queries still run without it.
  }
}
