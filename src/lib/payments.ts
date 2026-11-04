/**
 * Online checkout through HDFC SmartGateway.
 * Routes, modules, and the return handler stay in the app.
 * Set this to true to offer HDFC again. Cash on delivery stays available.
 */
export const HDFC_CHECKOUT_ENABLED = true;

export type CheckoutPaymentChoice = "cod" | "hdfc";
