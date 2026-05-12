/**
 * services/index.ts
 *
 * CartService, ReviewService, AdminAnalyticsService
 * Single-store mono marketplace — Pharmacy, Supermarket, Cosmetics
 * No vendor, no multi-store logic.
 */

import { Types } from 'mongoose';
import { Cart, Order, Review } from '../models/index';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { getPaginationOptions, createPaginatedResult, getDateRange } from '../utils/helpers';
import { ICart, IReview, PaginatedResult, SalesAnalytics } from '../types';

// ═══════════════════════════════════════════════════════════════════════════════
// CART SERVICE
// ═══════════════════════════════════════════════════════════════════════════════
export class CartService {
  async getCart(userId: string): Promise<ICart> {
    let cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      select: 'name images price effectivePrice stock status storeSection prescriptionRequired',
    });

    if (!cart) {
      return (await Cart.create({ user: userId, items: [] })) as unknown as ICart;
    }

    // Remove stale or deleted items silently
    const validItems = cart.items.filter((item) => {
      const p = item.product as unknown as { status: string };
      return p && p.status !== 'deleted';
    });

    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    return cart as unknown as ICart;
  }

  async addItem(userId: string, body: { productId: string; quantity: number; selectedVariant?: string }): Promise<ICart> {
    const { productId, quantity, selectedVariant } = body;

    const product = await Product.findById(productId);
    if (!product)                        throw ApiError.notFound('Product not found');
    if (product.status === 'deleted')    throw ApiError.badRequest('Product is no longer available');
    if (product.status === 'inactive')   throw ApiError.badRequest('Product is currently unavailable');
    if (product.stock < quantity)        throw ApiError.badRequest(`Only ${product.stock} unit(s) available`);

    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = await Cart.create({ user: userId, items: [] });

    const existingIdx = cart.items.findIndex(
      (i) => i.product.toString() === productId
    );

    if (existingIdx > -1) {
      const newQty = cart.items[existingIdx].quantity + quantity;
      if (newQty > product.stock) throw ApiError.badRequest(`Only ${product.stock} unit(s) available`);
      cart.items[existingIdx].quantity = newQty;
    } else {
      cart.items.push({
        product: new Types.ObjectId(productId),
        quantity,
        price: (product as unknown as { effectivePrice: number }).effectivePrice || product.price,
        selectedVariant,
      } as any);
    }

    await cart.save();
    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, quantity: number): Promise<ICart> {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw ApiError.notFound('Cart not found');

    if (quantity <= 0) {
      // Treat zero/negative as remove
      cart.items = cart.items.filter((i) => i._id?.toString() !== itemId);
      await cart.save();
      return this.getCart(userId);
    }

    const item = cart.items.find((i) => i._id?.toString() === itemId);
    if (!item) throw ApiError.notFound('Cart item not found');

    const product = await Product.findById(item.product);
    if (!product)                    throw ApiError.notFound('Product not found');
    if (product.stock < quantity)    throw ApiError.badRequest(`Only ${product.stock} unit(s) available`);

    item.quantity = quantity;
    await cart.save();
    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string): Promise<ICart> {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw ApiError.notFound('Cart not found');
    cart.items = cart.items.filter((i) => i._id?.toString() !== itemId);
    await cart.save();
    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<ICart> {
    const cart = await Cart.findOneAndUpdate(
      { user: userId },
      { items: [], discount: 0 },
      { new: true }
    );
    return (cart || await Cart.create({ user: userId, items: [] })) as unknown as ICart;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REVIEW SERVICE
// ═══════════════════════════════════════════════════════════════════════════════
export class ReviewService {
  async getProductReviews(
    productId: string,
    filters: Record<string, string>
  ): Promise<PaginatedResult<IReview>> {
    const { page, limit } = getPaginationOptions(filters);
    const query: Record<string, unknown> = { product: productId };
    if (filters.rating) query.rating = parseInt(filters.rating);

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('user', 'firstName lastName avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Review.countDocuments(query),
    ]);

    return createPaginatedResult(reviews as unknown as IReview[], total, { page, limit });
  }

  async createReview(
    productId: string,
    userId: string,
    payload: { rating: number; title?: string; comment: string }
  ): Promise<IReview> {
    const product = await Product.findById(productId);
    if (!product) throw ApiError.notFound('Product not found');

    const existing = await Review.findOne({ product: productId, user: userId });
    if (existing) throw ApiError.conflict('You have already reviewed this product');

    const review = await Review.create({
      ...payload,
      product: productId,
      user: userId,
      isVerifiedPurchase: false,
    });

    // Recalculate product rating
    const stats = await Review.aggregate([
      { $match: { product: new Types.ObjectId(productId) } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    if (stats.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        rating: Math.round(stats[0].avg * 10) / 10,
        totalRatings: stats[0].count,
      });
    }

    return review;
  }

  async voteHelpful(reviewId: string, _userId: string): Promise<IReview> {
    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { helpfulVotes: 1 } },
      { new: true }
    );
    if (!review) throw ApiError.notFound('Review not found');
    return review;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN ANALYTICS SERVICE
// ═══════════════════════════════════════════════════════════════════════════════
export class AdminAnalyticsService {
  async getPlatformAnalytics(period: 'today' | 'week' | 'month' | 'year' = 'month') {
    const { start, end } = getDateRange(period);

    const [revenueResult, totalOrders, totalProducts, totalCustomers,
           revenueByDay, ordersByStatus, topProducts, pendingPayments, lowStockCount] =
      await Promise.all([
        Order.aggregate([
          { $match: { paymentStatus: { $in: ['paid', 'confirmed'] }, createdAt: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
        Order.countDocuments({ createdAt: { $gte: start, $lte: end } }),
        Product.countDocuments({ status: { $ne: 'deleted' } }),
        User.countDocuments({ role: 'customer' }),
        Order.aggregate([
          { $match: { paymentStatus: { $in: ['paid', 'confirmed'] }, createdAt: { $gte: start, $lte: end } } },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
          { $sort: { _id: 1 } },
          { $project: { date: '$_id', revenue: 1, orders: 1, _id: 0 } },
        ]),
        Order.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $project: { status: '$_id', count: 1, _id: 0 } },
        ]),
        Order.aggregate([
          { $match: { paymentStatus: { $in: ['paid', 'confirmed'] } } },
          { $unwind: '$items' },
          { $group: { _id: '$items.product', revenue: { $sum: '$items.subtotal' }, sold: { $sum: '$items.quantity' } } },
          { $sort: { revenue: -1 } },
          { $limit: 10 },
          { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
          { $unwind: '$product' },
          { $project: { product: { name: 1, images: 1, price: 1, storeSection: 1 }, revenue: 1, sold: 1 } },
        ]),
        Order.countDocuments({ paymentStatus: 'awaiting_confirmation' }),
        Product.countDocuments({ $expr: { $lte: ['$stock', '$lowStockThreshold'] }, status: { $ne: 'deleted' } }),
      ]);

    return {
      stats: {
        totalRevenue:    revenueResult[0]?.total || 0,
        totalOrders,
        totalProducts,
        totalCustomers,
        pendingPayments,
        lowStockCount,
      },
      revenueByDay,
      topProducts,
      ordersByStatus,
    };
  }
}

// Singleton exports
export const cartService          = new CartService();
export const reviewService        = new ReviewService();
export const adminAnalyticsService = new AdminAnalyticsService();
