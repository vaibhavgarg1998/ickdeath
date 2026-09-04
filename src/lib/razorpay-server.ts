import Razorpay from "razorpay";
import crypto from "crypto";

export function getRazorpayClient() {
  const key_id = process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error("Razorpay keys are not configured");
  }

  return new Razorpay({ key_id, key_secret });
}

export function getRazorpayKeyId(): string {
  const key_id = process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!key_id) throw new Error("Razorpay key id is not configured");
  return key_id;
}

export function isRazorpayConfigured(): boolean {
  const key_id = process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  return Boolean(key_id && key_secret);
}

export function verifyRazorpaySignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_secret) return false;

  const body = `${input.orderId}|${input.paymentId}`;
  const expected = crypto
    .createHmac("sha256", key_secret)
    .update(body)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(input.signature, "utf8"),
    );
  } catch {
    return false;
  }
}
