/**
 * models/index.ts
 * Single-store models — Pharmacy, Supermarket, Cosmetics
 * No vendor references. Admin owns all products.
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import { ICategory, ICart, IOrder, IReview, INotification } from '../types';

// ─── Category ─────────────────────────────────────────────────────────────────
const CategorySchema = new Schema<ICategory>(
  {
    name:         { type: String, required: true, trim: true },
    slug:         { type: String, required: true, unique: true, lowercase: true },
    description:  String,
    image:        String,
    icon:         String,
    storeSection: { type: String, enum: ['pharmacy', 'supermarket', 'cosmetics'], required: true },
    parent:       { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    children:     [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    isActive:     { type: Boolean, default: true },
    sortOrder:    { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
CategorySchema.virtual('productCount', {
  ref: 'Product', localField: '_id', foreignField: 'category', count: true,
});
export const Category = mongoose.model<ICategory>('Category', CategorySchema);

// ─── Cart ─────────────────────────────────────────────────────────────────────
const CartItemSchema = new Schema({
  product:         { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity:        { type: Number, required: true, min: 1 },
  price:           { type: Number, required: true },
  selectedVariant: String,
}, { _id: true });

const CartSchema = new Schema<ICart>(
  {
    user:      { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items:     { type: [CartItemSchema], default: [] },
    couponCode: String,
    discount:  { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);
CartSchema.virtual('subtotal').get(function () {
  return this.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
});
CartSchema.virtual('total').get(function () {
  return Math.max(0, this.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0) - this.discount);
});
export const Cart = mongoose.model<ICart>('Cart', CartSchema);

// ─── Order ────────────────────────────────────────────────────────────────────
const AddressSchema = new Schema({
  label:      String,
  street:     { type: String, required: true },
  city:       { type: String, required: true },
  state:      String,
  country:    { type: String, required: true },
  postalCode: String,
  isDefault:  Boolean,
}, { _id: false });

const OrderItemSchema = new Schema({
  product:         { type: Schema.Types.ObjectId, ref: 'Product' },
  name:            { type: String, required: true },
  image:           String,
  price:           { type: Number, required: true },
  quantity:        { type: Number, required: true, min: 1 },
  selectedVariant: String,
  subtotal:        { type: Number, required: true },
}, { _id: false });

const StatusHistorySchema = new Schema({
  status:    { type: String, required: true },
  note:      String,
  timestamp: { type: Date, default: Date.now },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { _id: false });

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    user:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items:       { type: [OrderItemSchema], required: true },
    shippingAddress: { type: AddressSchema, required: true },
    subtotal:    { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    tax:         { type: Number, default: 0 },
    discount:    { type: Number, default: 0 },
    total:       { type: Number, required: true },
    status: {
      type:    String,
      enum:    ['pending','awaiting_payment','paid','processing','out_for_delivery','delivered','cancelled','refunded'],
      default: 'pending',
    },
    paymentStatus: {
      type:    String,
      enum:    ['pending','paid','failed','refunded','confirmed','rejected','awaiting_confirmation'],
      default: 'pending',
    },
    paymentMethod: {
      type:    String,
      enum:    ['manual','cash_on_delivery'],
      default: 'manual',
    },
    paymentProof:            String,
    paymentProofUploadedAt:  Date,
    paymentConfirmedAt:      Date,
    paymentRejectedAt:       Date,
    paymentRejectionReason:  String,
    notes:           String,
    statusHistory:   { type: [StatusHistorySchema], default: [] },

    deliveredAt:     Date,
  },
  { timestamps: true }
);
OrderSchema.index({ user: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });
export const Order = mongoose.model<IOrder>('Order', OrderSchema);

// ─── Review ───────────────────────────────────────────────────────────────────
const ReviewSchema = new Schema<IReview>(
  {
    product:           { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    user:              { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating:            { type: Number, required: true, min: 1, max: 5 },
    title:             { type: String, maxlength: 100 },
    comment:           { type: String, required: true, minlength: 5, maxlength: 2000 },
    isVerifiedPurchase: { type: Boolean, default: false },
    helpfulVotes:      { type: Number, default: 0 },
  },
  { timestamps: true }
);
ReviewSchema.index({ product: 1 });
ReviewSchema.index({ user: 1 });
ReviewSchema.index({ rating: 1 });
// One review per user per product
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });
export const Review = mongoose.model<IReview>('Review', ReviewSchema);

// ─── Notification ─────────────────────────────────────────────────────────────
const NotificationSchema = new Schema<INotification>(
  {
    user:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['order', 'payment', 'product', 'review', 'general'],
      required: true,
    },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    data:    Schema.Types.Mixed,
    isRead:  { type: Boolean, default: false },
  },
  { timestamps: true }
);
NotificationSchema.index({ user: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });
// Auto-delete after 90 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });
export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
