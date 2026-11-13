/**
 * Online checkout through HDFC SmartGateway.
 * Routes, modules, and the return handler stay in the app.
 * Set this to true to offer HDFC again.
 */
export const HDFC_CHECKOUT_ENABLED = true;

/**
 * Cash on delivery on the website checkout (Buy Now).
 * The order API stays so existing COD orders can still be tracked.
 * Set this to true to show the option again.
 */
export const COD_CHECKOUT_ENABLED = false;

export type CheckoutPaymentChoice = "cod" | "hdfc";
