import { CartItem, PaginatedResponse, Product, StoreSettings } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000/api";

export interface ProductFilters {
  brands?: string[];
  price_max?: number;
}

export async function fetchProducts(
  filters: ProductFilters = {},
  signal?: AbortSignal
): Promise<Product[]> {
  const params = new URLSearchParams();
  if (filters.brands && filters.brands.length > 0) {
    params.set("brand", filters.brands.join(","));
  }
  if (filters.price_max) params.set("price_max", String(filters.price_max));

  const query = params.toString();
  const res = await fetch(`${API_BASE_URL}/products/${query ? `?${query}` : ""}`, {
    cache: "no-store",
    signal,
  });
  if (!res.ok) throw new Error("Impossible de charger les produits");
  const data: PaginatedResponse<Product> | Product[] = await res.json();
  return Array.isArray(data) ? data : data.results;
}

export async function fetchProduct(id: number): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/products/${id}/`, { cache: "no-store" });
  if (!res.ok) throw new Error("Produit introuvable");
  return res.json();
}

export async function fetchSettings(signal?: AbortSignal): Promise<StoreSettings> {
  const res = await fetch(`${API_BASE_URL}/settings/`, { cache: "no-store", signal });
  if (!res.ok) throw new Error("Impossible de charger les parametres");
  return res.json();
}

// Best-effort order log sent right before redirecting to WhatsApp, so the
// admin has an order history even though the actual sale closes over
// WhatsApp, not through this API. Never throws — a logging failure should
// never block checkout.
export async function createOrder(items: CartItem[]): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/orders/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((item) => ({
          product_id: item.productId,
          brand: item.brand,
          name: item.name,
          unit_price: item.unitPrice,
          size: item.size,
          with_box: item.withBox,
          quantity: item.quantity,
          color_note: item.colorNote,
        })),
      }),
    });
  } catch {
    // ignored: this is telemetry, not a checkout requirement
  }
}

export function resolveMediaUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const origin = API_BASE_URL.replace(/\/api$/, "");
  return `${origin}${path}`;
}
