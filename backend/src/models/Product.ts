/**
 * Product.ts — Single-store product model
 * Products belong to the store (admin). No vendor field.
 */

import mongoose, { Schema, Types } from 'mongoose';
import { IProduct } from '../types';

const ProductImageSchema = new Schema({
  url:       { type: String, required: true },
  publicId:  { type: String, default: '' },
  alt:       String,
  isPrimary: { type: Boolean, default: false },
}, { _id: false });

const ProductVariantOptionSchema = new Schema({
  value: { type: String, required: true },
  price: Number,
  stock: Number,
}, { _id: false });

const ProductVariantSchema = new Schema({
  name:    { type: String, required: true },
  options: [ProductVariantOptionSchema],
}, { _id: false });

const DiscountSchema = new Schema({
  type:      { type: String, enum: ['percentage', 'fixed'] },
  value:     Number,
  startDate: Date,
  endDate:   Date,
}, { _id: false });

const ProductSchema = new Schema<IProduct>(
  {
    name:             { type: String, required: true, trim: true, maxlength: 200 },
    slug:             { type: String, required: true, unique: true, lowercase: true },
    sku:              { type: String, required: true, unique: true },
    description:      { type: String, required: true },
    shortDescription: { type: String, maxlength: 500 },
    price:            { type: Number, required: true, min: 0 },
    compareAtPrice:   { type: Number, min: 0 },
    costPrice:        { type: Number, min: 0 },
    effectivePrice:   { type: Number, default: 0 },
    stock:            { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold:{ type: Number, default: 5 },
    // Category
    category:         { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategory:      { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    storeSection:     { type: String, enum: ['pharmacy', 'supermarket', 'cosmetics'], index: true },
    // Pharmacy specific
    prescriptionRequired: { type: Boolean, default: false },
    prescriptionNote:     { type: String, maxlength: 500 },
    // Content
    tags:     [{ type: String, trim: true, lowercase: true }],
    images:   { type: [ProductImageSchema], default: [] },
    variants: { type: [ProductVariantSchema], default: [] },
    discount: DiscountSchema,
    // Stats
    rating:       { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    totalSold:    { type: Number, default: 0 },
    views:        { type: Number, default: 0 },
    isFeatured:   { type: Boolean, default: false },
    weight:       Number,
    // SEO
    metaTitle:       String,
    metaDescription: String,
    // Status
    status: {
      type:    String,
      enum:    ['active', 'inactive', 'out_of_stock', 'deleted'],
      default: 'active',
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Indexes
ProductSchema.index({ category: 1 });
ProductSchema.index({ subcategory: 1 });
ProductSchema.index({ storeSection: 1, status: 1 });
ProductSchema.index({ isFeatured: 1, status: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ rating: -1 });
ProductSchema.index({ totalSold: -1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Auto-calculate effectivePrice before save
ProductSchema.pre('save', function (next) {
  const now = new Date();
  if (
    this.discount?.value &&
    (!this.discount.startDate || this.discount.startDate <= now) &&
    (!this.discount.endDate   || this.discount.endDate   >= now)
  ) {
    this.effectivePrice = this.discount.type === 'percentage'
      ? this.price * (1 - this.discount.value / 100)
      : Math.max(0, this.price - this.discount.value);
  } else {
    this.effectivePrice = this.price;
  }
  // Auto-mark out of stock
  if (this.stock <= 0 && this.status === 'active') {
    this.status = 'out_of_stock' as any;
  }
  if (this.stock > 0 && this.status === 'out_of_stock') {
    this.status = 'active' as any;
  }
  next();
});

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
