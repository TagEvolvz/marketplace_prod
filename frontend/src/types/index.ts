/**
 * types/index.ts — Frontend TypeScript types
 * Single-store: Pharmacy | Supermarket | Cosmetics
 */

// ─── Core ─────────────────────────────────────────────────────────────────────
export type UserRole     = 'customer' | 'admin';
export type StoreSection = 'pharmacy' | 'supermarket' | 'cosmetics';
export type OrderStatus  = 'pending' | 'awaiting_payment' | 'paid' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'confirmed' | 'rejected' | 'awaiting_confirmation';

// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  wishlist: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ─── Address ──────────────────────────────────────────────────────────────────
export interface Address {
  street: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  label?: string;
}

// ─── Category ─────────────────────────────────────────────────────────────────
export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  storeSection: StoreSection;
  parent?: string | Category;
  children?: Category[];
  isActive: boolean;
  sortOrder: number;
  productCount?: number;
}

// ─── Product ─────────────────────────────────────────────────────────────────
export interface ProductImage {
  url: string;
  publicId?: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface ProductVariantOption {
  value: string;
  price?: number;
  stock?: number;
}

export interface ProductVariant {
  name: string;
  options: ProductVariantOption[];
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  effectivePrice: number;
  stock: number;
  lowStockThreshold: number;
  category: Category | string;
  subcategory?: Category | string;
  storeSection?: StoreSection;
  prescriptionRequired: boolean;
  prescriptionNote?: string;
  tags: string[];
  images: ProductImage[];
  variants: ProductVariant[];
  weight?: number;
  rating: number;
  totalRatings: number;
  totalSold: number;
  views: number;
  isFeatured: boolean;
  status: 'active' | 'inactive' | 'out_of_stock' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
export interface CartItem {
  _id: string;
  product: Product;
  quantity: number;
  price: number;
  selectedVariant?: string;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  totalAmount: number;
  discount: number;
  updatedAt: string;
}

// ─── Order ────────────────────────────────────────────────────────────────────
export interface OrderItem {
  product: Product;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: User | string;
  items: OrderItem[];
  shippingAddress: Address;
  subtotal: number;
  shippingFee: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: 'manual' | 'cash_on_delivery';
  paymentProof?: string;
  paymentProofUploadedAt?: string;
  paymentConfirmedAt?: string;
  paymentRejectedAt?: string;
  paymentRejectionReason?: string;
  notes?: string;
  statusHistory: { status: OrderStatus; timestamp: string; note?: string }[];
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Review ───────────────────────────────────────────────────────────────────
export interface Review {
  _id: string;
  product: string;
  user: User;
  rating: number;
  title?: string;
  comment: string;
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  createdAt: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export interface Notification {
  _id: string;
  user: string;
  type: 'order' | 'payment' | 'product' | 'review' | 'general';
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

// ─── Paginated response ───────────────────────────────────────────────────────
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ─── API response ─────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  code?: string;
  errors?: { field: string; message: string }[];
}
