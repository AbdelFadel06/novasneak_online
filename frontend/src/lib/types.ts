export interface ProductImage {
  id: number;
  image: string;
  order: number;
}

export interface Product {
  id: number;
  brand: string;
  name: string;
  price: number;
  active: boolean;
  created_at: string;
  images: ProductImage[];
}

export interface StoreSettings {
  store_name: string;
  whatsapp_number: string;
  box_discount: number;
  currency: string;
  size_min: number;
  size_max: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CartItem {
  cartId: string;
  productId: number;
  brand: string;
  name: string;
  unitPrice: number;
  size: number;
  withBox: boolean;
  quantity: number;
  colorNote: string;
  image: string | null;
}

export interface OrderItem {
  id: number;
  product: number | null;
  brand: string;
  name: string;
  unit_price: number;
  size: number;
  with_box: boolean;
  quantity: number;
  color_note: string;
}

export interface Order {
  id: number;
  created_at: string;
  total: number;
  currency: string;
  items: OrderItem[];
}

export interface AdminStats {
  orders_total: number;
  revenue_total: number;
  orders_today: number;
  revenue_today: number;
  products_active: number;
  products_total: number;
  top_products: { brand: string; name: string; total_quantity: number }[];
  period: {
    start: string;
    end: string;
    days: number;
    orders: number;
    revenue: number;
    daily: { date: string; orders: number; revenue: number }[];
  };
}
