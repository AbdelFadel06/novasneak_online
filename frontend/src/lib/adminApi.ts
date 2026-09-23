import { AdminStats, Order, PaginatedResponse, Product, ProductImage, StoreSettings } from "./types";
import { useAuthStore } from "./auth-store";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000/api";

export class AuthError extends Error {}

export async function login(username: string, password: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(
      data?.detail || "Identifiants incorrects ou compte non autorise pour l'administration."
    );
  }
  const data = await res.json();
  useAuthStore.getState().setTokens(data.access, data.refresh, data.user?.username ?? username);
}

export function logout(): void {
  useAuthStore.getState().clear();
}

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, username, setTokens, clear } = useAuthStore.getState();
  if (!refreshToken) return null;
  const res = await fetch(`${API_BASE_URL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: refreshToken }),
  });
  if (!res.ok) {
    clear();
    return null;
  }
  const data = await res.json();
  setTokens(data.access, data.refresh ?? refreshToken, username ?? "");
  return data.access;
}

async function adminFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const { accessToken } = useAuthStore.getState();
  const headers = new Headers(options.headers);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  let res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, cache: "no-store" });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) throw new AuthError("Session expiree, merci de vous reconnecter.");
    headers.set("Authorization", `Bearer ${newToken}`);
    res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, cache: "no-store" });
  }
  return res;
}

async function adminJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await adminFetch(path, options);
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.detail || `Erreur (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function fetchAdminProducts(): Promise<Product[]> {
  const data = await adminJson<PaginatedResponse<Product> | Product[]>(
    "/admin/products/?page_size=200"
  );
  return Array.isArray(data) ? data : data.results;
}

export async function fetchAdminProduct(id: number): Promise<Product> {
  return adminJson<Product>(`/admin/products/${id}/`);
}

export interface ProductInput {
  brand: string;
  name: string;
  price: number;
  active: boolean;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  return adminJson<Product>("/admin/products/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function updateProduct(id: number, input: Partial<ProductInput>): Promise<Product> {
  return adminJson<Product>(`/admin/products/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function deleteProduct(id: number): Promise<void> {
  await adminJson<void>(`/admin/products/${id}/`, { method: "DELETE" });
}

export async function uploadProductImage(
  productId: number,
  file: File,
  order: number
): Promise<ProductImage> {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("order", String(order));
  return adminJson<ProductImage>(`/admin/products/${productId}/images/`, {
    method: "POST",
    body: formData,
  });
}

export async function deleteProductImage(imageId: number): Promise<void> {
  await adminJson<void>(`/admin/images/${imageId}/`, { method: "DELETE" });
}

export async function reorderProductImage(imageId: number, order: number): Promise<void> {
  await adminJson<void>(`/admin/images/${imageId}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order }),
  });
}

export async function fetchAdminSettings(): Promise<StoreSettings> {
  return adminJson<StoreSettings>("/admin/settings/");
}

export async function updateAdminSettings(
  input: Partial<StoreSettings>
): Promise<StoreSettings> {
  return adminJson<StoreSettings>("/admin/settings/", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function fetchOrders(): Promise<Order[]> {
  const data = await adminJson<PaginatedResponse<Order> | Order[]>("/admin/orders/?page_size=200");
  return Array.isArray(data) ? data : data.results;
}

export type StatsRange = { days: number } | { start: string; end: string };

export async function fetchStats(range: StatsRange = { days: 7 }): Promise<AdminStats> {
  const params =
    "start" in range
      ? `start=${range.start}&end=${range.end}`
      : `days=${range.days}`;
  return adminJson<AdminStats>(`/admin/stats/?${params}`);
}
