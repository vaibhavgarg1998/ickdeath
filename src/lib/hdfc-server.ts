import { APIError, Juspay } from "expresscheckout-nodejs";
import crypto from "crypto";

const SANDBOX_BASE_URL = "https://smartgateway.hdfcuat.bank.in";
const PRODUCTION_BASE_URL = "https://smartgateway.hdfc.bank.in";

export class HdfcConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HdfcConfigError";
  }
}

function pemFromEnv(raw: string | undefined): string {
  if (!raw) return "";
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n").trim();
}

function isRealPem(raw: string): boolean {
  if (!raw.includes("BEGIN") || raw.includes("...")) return false;
  const body = raw
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s/g, "");
  return body.length > 80;
}

function jweReady(): boolean {
  const keyId = process.env.HDFC_KEY_UUID?.trim();
  const publicKey = pemFromEnv(process.env.HDFC_PUBLIC_KEY);
  const privateKey = pemFromEnv(process.env.HDFC_PRIVATE_KEY);
  return Boolean(keyId && isRealPem(publicKey) && isRealPem(privateKey));
}

function resolveBaseUrl(): string {
  const configured = process.env.HDFC_BASE_URL?.trim().replace(/\/$/, "");
  if (!configured) {
    return process.env.HDFC_ENV === "production" ? PRODUCTION_BASE_URL : SANDBOX_BASE_URL;
  }
  if (configured !== SANDBOX_BASE_URL && configured !== PRODUCTION_BASE_URL) {
    throw new HdfcConfigError(
      "HDFC_BASE_URL must be the SmartGateway sandbox or production URL",
    );
  }
  return configured;
}

/** Merchant id + payment page client id, and either JWE keys or an API key. */
export function isHdfcConfigured(): boolean {
  const merchantId = process.env.HDFC_MERCHANT_ID?.trim();
  const clientId = process.env.HDFC_PAYMENT_PAGE_CLIENT_ID?.trim();
  if (!merchantId || !clientId) return false;
  return jweReady() || Boolean(process.env.HDFC_API_KEY?.trim());
}

let cached: Juspay | null = null;

export function getHdfcClient(): Juspay {
  if (cached) return cached;
  if (!isHdfcConfigured()) {
    throw new HdfcConfigError("HDFC SmartGateway is not configured on the server");
  }

  const logging = process.env.HDFC_ENABLE_LOGGING === "true";
  if (!logging) Juspay.customLogger = Juspay.silentLogger;

  const merchantId = process.env.HDFC_MERCHANT_ID!.trim();
  const keyId = process.env.HDFC_KEY_UUID?.trim();
  const publicKey = pemFromEnv(process.env.HDFC_PUBLIC_KEY);
  const privateKey = pemFromEnv(process.env.HDFC_PRIVATE_KEY);

  cached = new Juspay({
    merchantId,
    baseUrl: resolveBaseUrl(),
    ...(jweReady()
      ? { jweAuth: { keyId: keyId!, publicKey, privateKey } }
      : { apiKey: process.env.HDFC_API_KEY!.trim() }),
  });
  return cached;
}

export function getPaymentPageClientId(): string {
  const id = process.env.HDFC_PAYMENT_PAGE_CLIENT_ID?.trim();
  if (!id) throw new HdfcConfigError("HDFC_PAYMENT_PAGE_CLIENT_ID is not set");
  return id;
}

/** Alphanumeric, 15 characters, not sequential. SmartGateway rejects special characters and ids of 18+. */
export function generateHdfcOrderId(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(12);
  let id = "ICK";
  for (let i = 0; i < bytes.length; i++) {
    id += alphabet[bytes[i]! % alphabet.length];
  }
  return id;
}

export function paiseToRupees(amountPaise: number): number {
  return Number((amountPaise / 100).toFixed(2));
}

export function rupeesToPaise(amount: unknown): number | null {
  const n = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export type HdfcGatewayStatus = {
  orderId: string;
  status: string;
  amountPaise: number | null;
  txnId: string;
};

export async function fetchHdfcOrderStatus(
  hdfcOrderId: string,
): Promise<HdfcGatewayStatus> {
  const response = await getHdfcClient().order.status(hdfcOrderId);
  return {
    orderId: String(response.order_id ?? hdfcOrderId),
    status: String(response.status ?? ""),
    amountPaise: rupeesToPaise(response.amount),
    txnId: String(response.txn_id ?? ""),
  };
}

export function isHdfcApiError(err: unknown): err is APIError {
  return err instanceof APIError;
}

export type HdfcOutcome = "paid" | "pending" | "failed" | "cancelled";

export function classifyHdfcStatus(status: string): HdfcOutcome {
  switch (status) {
    case "CHARGED":
      return "paid";
    case "PENDING":
    case "PENDING_VBV":
    case "AUTHORIZING":
      return "pending";
    case "NEW":
      return "cancelled";
    default:
      return "failed";
  }
}

export function siteOrigin(request: Request): string {
  // Come back to the host that started checkout. A fixed production URL
  // sends local payments to ickdeath.com, which 404s until this route is deployed.
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host) {
    const forwarded = request.headers.get("x-forwarded-proto");
    const proto =
      forwarded ??
      (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
    return `${proto}://${host}`;
  }

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  throw new HdfcConfigError("Set NEXT_PUBLIC_SITE_URL so HDFC can redirect back");
}

function withBase(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${base}${path}`;
}

/** Static return URL. SmartGateway rejects query strings on return_url. */
export function hdfcReturnUrl(request: Request): string {
  return `${siteOrigin(request)}${withBase("/api/hdfc/return/")}`;
}

export function appUrl(request: Request, path: string): string {
  return `${siteOrigin(request)}${withBase(path)}`;
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function isHdfcWebhookAuthorized(request: Request): boolean {
  const user = process.env.HDFC_WEBHOOK_USERNAME ?? "";
  const pass = process.env.HDFC_WEBHOOK_PASSWORD ?? "";
  if (!user || !pass) return false;

  const header = request.headers.get("authorization") ?? "";
  const prefix = "Basic ";
  if (!header.startsWith(prefix)) return false;

  let decoded = "";
  try {
    decoded = Buffer.from(header.slice(prefix.length), "base64").toString("utf8");
  } catch {
    return false;
  }

  const sep = decoded.indexOf(":");
  if (sep < 0) return false;
  return (
    safeEqual(decoded.slice(0, sep), user) && safeEqual(decoded.slice(sep + 1), pass)
  );
}

/** HMAC from the kit's RESPONSE_KEY. Skipped when the return body has no signature. */
export function verifyHdfcReturnSignature(params: Record<string, string>): boolean {
  const secret = process.env.HDFC_RESPONSE_KEY?.trim();
  const signature = params.signature;
  if (!secret || !signature) return true;

  const payload = Object.keys(params)
    .filter((key) => key !== "signature" && key !== "signature_algorithm")
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key] ?? "")}`)
    .join("&");
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64");
  return safeEqual(expected, signature);
}

export function hdfcOrderIdFromPayload(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  if (typeof record.order_id === "string" && record.order_id.trim()) {
    return record.order_id.trim();
  }
  if (typeof record.orderId === "string" && record.orderId.trim()) {
    return record.orderId.trim();
  }
  const content = record.content;
  if (!content || typeof content !== "object") return null;
  const order = (content as Record<string, unknown>).order;
  if (!order || typeof order !== "object") return null;
  const id = (order as Record<string, unknown>).order_id;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}
