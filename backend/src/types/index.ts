import { Document, Types } from 'mongoose';

// ─── Core types ───────────────────────────────────────────────────────────────
export type UserRole      = 'customer' | 'admin';
export type OrderStatus   = 'pending' | 'awaiting_payment' | 'paid' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'confirmed' | 'rejected' | 'awaiting_confirmation';
export type PaymentMethod = 'manual' | 'cash_on_delivery';
export type StoreSection  = 'pharmacy' | 'supermarket' | 'cosmetics';

// ─── User ─────────────────────────────────────────────────────────────────────
export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  addresses?: IAddress[];
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshTokens: string[];
  wishlist: Types.ObjectId[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

// ─── Address ──────────────────────────────────────────────────────────────────
export interface IAddress {
  label?: string;
  street: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  isDefault?: boolean;
}

// ─── Category ─────────────────────────────────────────────────────────────────
export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  storeSection: StoreSection;
  parent?: Types.ObjectId | ICategory;
  children?: ICategory[];
  isActive: boolean;
  sortOrder: number;
  productCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Product ──────────────────────────────────────────────────────────────────
export interface IProductImage {
  url: string;
  publicId: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface IProductVariant {
  name: string;
  options: { value: string; price?: number; stock?: number }[];
}

export interface IDiscount {
  type: 'percentage' | 'fixed';
  value: number;
  startDate?: Date;
  endDate?: Date;
}

export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  effectivePrice: number;
  stock: number;
  lowStockThreshold: number;
  category: Types.ObjectId | ICategory;
  subcategory?: Types.ObjectId | ICategory;
  storeSection?: StoreSection;
  prescriptionRequired: boolean;
  prescriptionNote?: string;
  tags: string[];
  images: IProductImage[];
  variants: IProductVariant[];
  discount?: IDiscount;
  rating: number;
  totalRatings: number;
  totalSold: number;
  views: number;
  isFeatured: boolean;
  weight?: number;
  metaTitle?: string;
  metaDescription?: string;
  status: 'active' | 'inactive' | 'out_of_stock' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
export interface ICartItem {
  _id: string;
  product: Types.ObjectId | IProduct;
  quantity: number;
  price: number;
  selectedVariant?: Record<string, string>;
}

export interface ICart extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId | IUser;
  items: ICartItem[];
  totalAmount: number;
  discount: number;
  couponCode?: string;
  updatedAt: Date;
}

// ─── Order ────────────────────────────────────────────────────────────────────
export interface IOrderItem {
  product: Types.ObjectId | IProduct;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  subtotal: number;
  selectedVariant?: Record<string, string>;
}

export interface IStatusHistory {
  status: OrderStatus;
  timestamp: Date;
  note?: string;
  updatedBy?: Types.ObjectId;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  orderNumber: string;
  user: Types.ObjectId | IUser;
  items: IOrderItem[];
  shippingAddress: IAddress;
  subtotal: number;
  shippingFee: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentProof?: string;
  paymentProofUploadedAt?: Date;
  paymentConfirmedAt?: Date;
  paymentRejectedAt?: Date;
  paymentRejectionReason?: string;
  notes?: string;
  statusHistory: IStatusHistory[];
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Review ───────────────────────────────────────────────────────────────────
export interface IReview extends Document {
  _id: Types.ObjectId;
  product: Types.ObjectId | IProduct;
  user: Types.ObjectId | IUser;
  rating: number;
  title?: string;
  comment: string;
  helpfulVotes: number;
  isVerifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export type NotificationType = 'order' | 'payment' | 'product' | 'review' | 'general';

export interface INotification extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId | IUser;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: Date;
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface SalesAnalytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: unknown[];
  salesByPeriod: unknown[];
}

// ─── Express extension ────────────────────────────────────────────────────────
import { Request } from 'express';
export interface AuthenticatedRequest extends Request {
  user?: IUser;
  requestId: string;
}
