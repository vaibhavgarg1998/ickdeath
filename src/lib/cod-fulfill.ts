import { getFirestore } from "firebase-admin/firestore";
import {
  getFirebaseAdminApp,
  isFirebaseAdminConfigured,
} from "@/lib/firebase-admin";
import { isValidCityForState, isValidState } from "@/lib/india-locations";
import {
  generateOrderId,
  isNormalizedMobile,
  isValidEmail,
  isValidPincode,
  normalizePhone,
  type CheckoutDraft,
  type PlacedOrder,
} from "@/lib/orders";
import { postOrdersWebhook } from "@/lib/orders-webhook";
import {
  cartTotalPaise,
  cartTotalQty,
  formatOrderItems,
  isColorwayId,
  normalizeCartLines,
  PRODUCT,
} from "@/lib/product";
import { notifyOrderWhatsApp } from "@/lib/whatsapp-notify";

export class CodOrderError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "CodOrderError";
    this.status = status;
  }
}

function validatedOrder(draft: CheckoutDraft, orderId: string, createdAt: string): PlacedOrder {
  const lines = normalizeCartLines(draft?.lines, draft?.colorway, draft?.quantity);
  const quantity = cartTotalQty(lines);
  if (quantity < PRODUCT.minQty || quantity > PRODUCT.maxQty) {
    throw new CodOrderError("Choose a valid quantity", 400);
  }

  const name = draft?.contact?.name?.trim() ?? "";
  const phone = normalizePhone(draft?.contact?.phone ?? "");
  const email = draft?.contact?.email?.trim() ?? "";
  if (!name) throw new CodOrderError("Name is required", 400);
  if (!isNormalizedMobile(phone)) {
    throw new CodOrderError("Enter a valid 10-digit WhatsApp number", 400);
  }
  if (!isValidEmail(email)) {
    throw new CodOrderError("Enter a valid email or leave it blank", 400);
  }

  const line1 = draft?.address?.line1?.trim() ?? "";
  const line2 = draft?.address?.line2?.trim() ?? "";
  const pincode = draft?.address?.pincode?.trim() ?? "";
  const city = draft?.address?.city?.trim() ?? "";
  const state = draft?.address?.state?.trim() ?? "";
  if (!line1) throw new CodOrderError("Address is required", 400);
  if (!isValidPincode(pincode)) {
    throw new CodOrderError("Enter a valid 6-digit pincode", 400);
  }
  if (!isValidState(state) || !isValidCityForState(state, city)) {
    throw new CodOrderError("Select a valid city and state", 400);
  }

  const colorway = isColorwayId(draft?.colorway)
    ? draft.colorway
    : (lines[0]?.colorway ?? "simple");

  return {
    lines,
    quantity,
    colorway,
    contact: { name, phone, email },
    address: { line1, line2, pincode, city, state },
    orderId,
    createdAt,
    amountPaise: cartTotalPaise(lines),
    paymentMethod: "cod",
    paymentStatus: "pending",
    orderStatus: "confirmed",
  };
}

/**
 * Save a cash-on-delivery order with a server-side total, then send the
 * confirmation. Payment stays pending until cash is collected.
 */
export async function placeCodOrder(draft: CheckoutDraft): Promise<PlacedOrder> {
  if (!isFirebaseAdminConfigured()) {
    throw new CodOrderError("Orders cannot be saved right now", 503);
  }

  const db = getFirestore(getFirebaseAdminApp());
  const createdAt = new Date().toISOString();
  const base = validatedOrder(draft, generateOrderId(), createdAt);
  let order: PlacedOrder | null = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const orderId = attempt === 0 ? base.orderId : generateOrderId();
    const candidate = { ...base, orderId };
    const ref = db.collection("orders").doc(orderId);
    const created = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists) return false;
      tx.set(ref, {
        ...candidate,
        productId: PRODUCT.id,
        productName: formatOrderItems(candidate),
        source: "ickdeath-website",
        updatedAt: createdAt,
      });
      return true;
    });
    if (created) {
      order = candidate;
      break;
    }
  }

  if (!order) {
    throw new CodOrderError("Could not allocate an order id", 500);
  }

  try {
    await db
      .collection("phoneIndex")
      .doc(order.contact.phone)
      .collection("orders")
      .doc(order.orderId)
      .set({
        orderId: order.orderId,
        createdAt: order.createdAt,
      });
  } catch (err) {
    console.error("cod phone index failed", err);
  }

  try {
    await notifyOrderWhatsApp({ order, event: "confirmed" });
  } catch (err) {
    console.error("whatsapp confirmed failed", err);
  }
  await postOrdersWebhook(order);

  return order;
}
