import { withBasePath } from "@/lib/paths";

/** Optional Node host when the storefront is static (GitHub Pages). */
function apiBase(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
}

export function apiUrl(path: string): string {
  const withLeading = path.startsWith("/") ? path : `/${path}`;
  const noTrailing = withLeading.endsWith("/") ? withLeading.slice(0, -1) : withLeading;
  const base = apiBase();
  if (base) return `${base}${noTrailing}`;
  return withBasePath(noTrailing);
}

export async function readApiJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed || trimmed.startsWith("<") || trimmed.startsWith("<!")) {
    throw new Error(
      "Payment server is not available here. Use npm run dev (localhost) or deploy to Vercel — GitHub Pages cannot run Razorpay APIs.",
    );
  }
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    throw new Error("Payment server returned an invalid response");
  }
}
