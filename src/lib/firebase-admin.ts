import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { PlacedOrder } from "@/lib/orders";
import { PRODUCT } from "@/lib/product";

function isAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY,
  );
}

export function getFirebaseAdminApp(): App {
  if (!isAdminConfigured()) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY.",
    );
  }

  const existing = getApps()[0];
  if (existing) return existing;

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(
    /\\n/g,
    "\n",
  );

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
