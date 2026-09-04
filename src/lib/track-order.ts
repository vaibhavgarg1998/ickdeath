import { parseTrackQuery, type PublicTrackedOrder } from "@/lib/orders";
import { findOrdersForTrackingClient } from "@/lib/orders-db";
import { withBasePath } from "@/lib/paths";

function apiUrl(path: string): string {
  const withSlash = path.endsWith("/") ? path : `${path}/`;
  return withBasePath(withSlash);
}

export async function trackOrders(query: string): Promise<PublicTrackedOrder[]> {
  const parsed = parseTrackQuery(query);
  if (parsed.kind === "invalid") {
    throw new Error(parsed.message);
  }

  const apiResult = await tryTrackViaApi(query);
  if (!apiResult.ok && apiResult.clientError) {
    throw new Error(apiResult.clientError);
  }

  try {
    const fromClient = await findOrdersForTrackingClient(parsed);
    if (fromClient.length > 0) return fromClient;
    if (apiResult.ok) return apiResult.orders;
    return fromClient;
  } catch (err) {
    if (apiResult.ok) return apiResult.orders;
    throw err instanceof Error
      ? err
      : new Error(apiResult.serverError ?? "Could not look up your order");
  }
}

async function tryTrackViaApi(query: string): Promise<
  | { ok: true; orders: PublicTrackedOrder[] }
  | { ok: false; clientError?: string; serverError?: string }
> {
  try {
    const res = await fetch(apiUrl("/api/orders/track"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    let data: { orders?: PublicTrackedOrder[]; error?: string } = {};
    try {
      data = (await res.json()) as typeof data;
    } catch {
      data = {};
    }

    if (res.ok) {
      return { ok: true, orders: data.orders ?? [] };
    }

    if (res.status === 400) {
      return { ok: false, clientError: data.error ?? "Invalid lookup" };
    }

    return {
      ok: false,
      serverError: data.error ?? "Could not look up your order",
    };
  } catch {
    return { ok: false, serverError: "Could not look up your order" };
  }
}
