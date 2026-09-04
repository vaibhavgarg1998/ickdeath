import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { PRODUCT } from "@/lib/product";
import type {
  OrderStatus,
  PaymentStatus,
  PlacedOrder,
} from "@/lib/orders";

export const ORDERS_COLLECTION = "orders";

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

  const ref = doc(getFirebaseDb(), ORDERS_COLLECTION, order.orderId);
  await setDoc(ref, record);
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
      onData(snap.docs.map((d) => toOrderRecord(d.data())));
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
