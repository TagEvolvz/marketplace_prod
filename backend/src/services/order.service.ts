/**
 * order.service.ts — FLOW single-store order management
 * Manual bank transfer payment only.
 */

import { Types } from 'mongoose';
import { Order } from '../models/index';
import { Cart } from '../models/index';
import { Product } from '../models/Product';
import { Notification } from '../models/index';
import { ApiError } from '../utils/ApiError';
import { generateOrderNumber, getPaginationOptions, createPaginatedResult } from '../utils/helpers';
import { IOrder, IAddress, PaginatedResult } from '../types';
import logger from '../utils/logger';
import productService from './product.service';
import { BANK_ACCOUNTS, PAYMENT_CONFIG } from '../config/payment';

export class OrderService {
  // ─── Bank details for checkout page ────────────────────────────────────────
  getBankDetails() {
    return { accounts: BANK_ACCOUNTS, config: PAYMENT_CONFIG };
  }

  // ─── Emit socket event safely ────────────────────────────────────────────────
  private async emitSocket(room: string, event: string, data: unknown): Promise<void> {
    try {
      const { getSocketServer } = await import('../sockets');
      const io = getSocketServer();
      if (io) io.to(room).emit(event, data);
    } catch { /* socket not available in all environments */ }
  }

  // ─── Create order (manual payment) ─────────────────────────────────────────
  async createManualCheckout(userId: string, shippingAddress: IAddress, notes?: string): Promise<IOrder> {
    const cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      select: 'name price images stock status effectivePrice',
    });

    if (!cart || cart.items.length === 0) throw ApiError.badRequest('Your cart is empty');

    for (const item of cart.items) {
      const p = item.product as unknown as { stock: number; status: string; name: string };
      if (!p) throw ApiError.badRequest('A product in your cart is no longer available');
      if (p.status === 'deleted' || p.status === 'inactive') throw ApiError.badRequest(`"${p.name}" is no longer available`);
      if (p.stock < item.quantity) throw ApiError.badRequest(`"${p.name}" only has ${p.stock} unit(s) in stock`);
    }

    const subtotal = cart.items.reduce((sum, item) => {
      const p = item.product as unknown as { effectivePrice: number };
      return sum + p.effectivePrice * item.quantity;
    }, 0);

    const shippingFee = subtotal >= 50 ? 0 : 9.99;
    const tax         = parseFloat((subtotal * 0.08).toFixed(2));
    const total       = parseFloat((subtotal + shippingFee + tax).toFixed(2));

    const order = await Order.create({
      orderNumber:     generateOrderNumber(),
      user:            userId,
      items:           cart.items.map((item) => {
        const p = item.product as unknown as { _id: Types.ObjectId; name: string; images: { url: string }[]; effectivePrice: number };
        return {
          product:  p._id,
          name:     p.name,
          image:    p.images[0]?.url || '',
          price:    p.effectivePrice,
          quantity: item.quantity,
          subtotal: parseFloat((p.effectivePrice * item.quantity).toFixed(2)),
        };
      }),
      shippingAddress,
      subtotal:        parseFloat(subtotal.toFixed(2)),
      shippingFee,
      tax,
      discount:        cart.discount || 0,
      total,
      status:          'pending',
      paymentStatus:   'awaiting_confirmation',
      paymentMethod:   'manual',
      notes,
      statusHistory:   [{ status: 'pending', timestamp: new Date(), note: 'Order placed — awaiting payment' }],
    });

    // Decrement stock
    for (const item of cart.items) {
      const p = item.product as unknown as { _id: Types.ObjectId };
      await productService.updateStock(p._id.toString(), item.quantity);
    }

    // Clear cart
    await Cart.findOneAndUpdate({ user: userId }, { items: [], discount: 0 });

    // Notify customer
    await Notification.create({
      user:    userId,
      type:    'order',
      title:   'Order Placed',
      message: `Order #${order.orderNumber} placed. Please upload your payment proof to confirm.`,
      data:    { orderId: order._id, orderNumber: order.orderNumber },
    });

    await this.emitSocket(userId, 'order:created', { orderNumber: order.orderNumber, total });

    logger.info('Order created', { orderId: order._id.toString(), userId, total });
    return order;
  }

  // ─── Upload payment proof ───────────────────────────────────────────────────
  async uploadPaymentProof(orderId: string, userId: string, proofUrl: string): Promise<IOrder> {
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) throw ApiError.notFound('Order not found');
    if (['confirmed', 'paid'].includes(order.paymentStatus)) throw ApiError.badRequest('Payment is already confirmed');

    order.paymentProof           = proofUrl;
    order.paymentProofUploadedAt = new Date();
    order.paymentStatus          = 'awaiting_confirmation';
    order.statusHistory.push({ status: order.status, timestamp: new Date(), note: 'Payment proof uploaded by customer' });
    await order.save();

    await this.emitSocket('admin-room', 'payment:proof-uploaded', { orderId: order._id, orderNumber: order.orderNumber });
    logger.info('Payment proof uploaded', { orderId, userId });
    return order;
  }

  // ─── Admin: confirm payment ─────────────────────────────────────────────────
  async confirmPayment(orderId: string, adminId: string): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');
    if (!order.paymentProof) throw ApiError.badRequest('No payment proof has been uploaded yet');

    order.paymentStatus      = 'confirmed';
    order.paymentConfirmedAt = new Date();
    order.status             = 'processing';
    order.statusHistory.push({
      status:    'processing',
      timestamp: new Date(),
      note:      'Payment confirmed by admin — order is being processed',
      updatedBy: new Types.ObjectId(adminId),
    });
    await order.save();

    await Notification.create({
      user:    order.user,
      type:    'payment',
      title:   'Payment Confirmed',
      message: `Your payment for order #${order.orderNumber} has been confirmed. We are now processing your order.`,
      data:    { orderId: order._id, orderNumber: order.orderNumber },
    });

    await this.emitSocket(order.user.toString(), 'payment:confirmed', { orderNumber: order.orderNumber });
    logger.info('Payment confirmed', { orderId, adminId });
    return order;
  }

  // ─── Admin: reject payment ──────────────────────────────────────────────────
  async rejectPayment(orderId: string, adminId: string, reason: string): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    order.paymentStatus          = 'rejected';
    order.paymentRejectedAt      = new Date();
    order.paymentRejectionReason = reason;
    order.status                 = 'pending';
    order.statusHistory.push({
      status:    'pending',
      timestamp: new Date(),
      note:      `Payment rejected: ${reason}`,
      updatedBy: new Types.ObjectId(adminId),
    });
    await order.save();

    await Notification.create({
      user:    order.user,
      type:    'payment',
      title:   'Payment Rejected',
      message: `Your payment proof for order #${order.orderNumber} was rejected. Reason: ${reason}. Please upload a valid proof.`,
      data:    { orderId: order._id, orderNumber: order.orderNumber },
    });

    await this.emitSocket(order.user.toString(), 'payment:rejected', { orderNumber: order.orderNumber, reason });
    logger.info('Payment rejected', { orderId, adminId, reason });
    return order;
  }

  // ─── Admin: update order status ─────────────────────────────────────────────
  async updateOrderStatus(orderId: string, status: string, note?: string): Promise<IOrder> {
    const valid = ['pending','awaiting_payment','paid','processing','out_for_delivery','delivered','cancelled','refunded'];
    if (!valid.includes(status)) throw ApiError.badRequest(`Invalid status. Must be one of: ${valid.join(', ')}`);

    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    order.status = status as IOrder['status'];
    order.statusHistory.push({
      status:    status as IOrder['status'],
      timestamp: new Date(),
      note:      note || `Status updated to ${status}`,
    });
    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }
    await order.save();

    await this.emitSocket(order.user.toString(), 'order:status-updated', { orderNumber: order.orderNumber, status });
    return order;
  }

  // ─── Customer: get my orders ────────────────────────────────────────────────
  async getMyOrders(userId: string, filters: Record<string, string>): Promise<PaginatedResult<IOrder>> {
    const { page, limit } = getPaginationOptions(filters);
    const query: Record<string, unknown> = { user: userId };
    if (filters.status) query.status = filters.status;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('items.product', 'name images slug')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(query),
    ]);

    return createPaginatedResult(orders, total, { page, limit });
  }

  // ─── Customer: get single order ─────────────────────────────────────────────
  async getOrderByNumber(orderNumber: string, userId: string): Promise<IOrder> {
    const order = await Order.findOne({ orderNumber, user: userId })
      .populate('items.product', 'name images slug price');
    if (!order) throw ApiError.notFound('Order not found');
    return order;
  }

  // ─── Customer: cancel order ─────────────────────────────────────────────────
  async cancelOrder(orderId: string, userId: string): Promise<IOrder> {
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) throw ApiError.notFound('Order not found');

    if (!['pending', 'awaiting_payment'].includes(order.status)) {
      throw ApiError.badRequest('This order cannot be cancelled at its current stage');
    }

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }

    order.status        = 'cancelled';
    order.paymentStatus = order.paymentStatus === 'confirmed' ? 'refunded' : 'failed';
    order.statusHistory.push({ status: 'cancelled', timestamp: new Date(), note: 'Cancelled by customer' });
    await order.save();

    logger.info('Order cancelled', { orderId, userId });
    return order;
  }

  // ─── Admin: get all orders ──────────────────────────────────────────────────
  async getAllOrders(filters: Record<string, string>): Promise<PaginatedResult<IOrder>> {
    const { page, limit } = getPaginationOptions(filters);
    const query: Record<string, unknown> = {};
    if (filters.status)        query.status        = filters.status;
    if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'firstName lastName email')
        .populate('items.product', 'name images')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(query),
    ]);

    return createPaginatedResult(orders, total, { page, limit });
  }
}

export default new OrderService();
