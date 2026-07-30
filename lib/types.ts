export type UserRole = 'customer' | 'vendor' | 'admin';

export type VendorStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type ProductStatus = 'active' | 'draft' | 'archived';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  image_url: string | null;
  created_at: string;
}

export interface Vendor {
  id: string;
  user_id: string;
  shop_name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  status: VendorStatus;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  position: number;
  created_at: string;
}

export interface Product {
  id: string;
  vendor_id: string;
  category_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  compare_price: number | null;
  stock: number;
  sku: string | null;
  rating: number;
  review_count: number;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  product_images?: ProductImage[];
  category?: Category | null;
  vendor?: Vendor | null;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
  profiles?: Pick<Profile, 'full_name' | 'avatar_url'> | null;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product?: Product;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  vendor_id: string | null;
  title: string;
  price: number;
  quantity: number;
  image_url: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_intent: string | null;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shipping_name: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}
