import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AuthenticatedRequest } from '../types';
import authService from '../services/auth.service';
import productService from '../services/product.service';
import orderService from '../services/order.service';
import { cartService, reviewService, adminAnalyticsService } from '../services/index';
import { ApiResponse } from '../utils/ApiError';
import { Category, Notification } from '../models/index';
import { User } from '../models/User';
import { getPaginationOptions, createPaginatedResult } from '../utils/helpers';

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════
export const authController = {
  register: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await authService.register(req.body);
      res.status(StatusCodes.CREATED).json(ApiResponse.success('Registration successful', result));
    } catch (err) { next(err); }
  },
  login: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body);
      if (result.refreshToken) {
        res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true, secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
        });
      }
      res.json(ApiResponse.success('Login successful', result));
    } catch (err) { next(err); }
  },
  refreshToken: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies?.refreshToken || req.body.refreshToken;
      const result = await authService.refreshToken(token);
      res.json(ApiResponse.success('Token refreshed', result));
    } catch (err) { next(err); }
  },
  logout: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies?.refreshToken || req.body.refreshToken;
      await authService.logout(req.user!._id.toString(), token);
      res.clearCookie('refreshToken');
      res.json(ApiResponse.success('Logged out'));
    } catch (err) { next(err); }
  },
  verifyEmail: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await authService.verifyEmail(req.query.token as string, req.query.email as string);
      res.json(ApiResponse.success('Email verified'));
    } catch (err) { next(err); }
  },
  forgotPassword: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await authService.forgotPassword(req.body.email);
      res.json(ApiResponse.success('Password reset email sent'));
    } catch (err) { next(err); }
  },
  resetPassword: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await authService.resetPassword(req.body.token, req.body.email, req.body.password);
      res.json(ApiResponse.success('Password reset successful'));
    } catch (err) { next(err); }
  },
  getMe: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await authService.getUserById(req.user!._id.toString());
      res.json(ApiResponse.success('User fetched', user));
    } catch (err) { next(err); }
  },
  updateProfile: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      let avatar: string | undefined;
      if (req.file) avatar = (req.file as Express.Multer.File & { path: string }).path;
      const user = await authService.updateProfile(req.user!._id.toString(), { ...req.body, ...(avatar && { avatar }) });
      res.json(ApiResponse.success('Profile updated', user));
    } catch (err) { next(err); }
  },
  changePassword: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await authService.changePassword(req.user!._id.toString(), req.body.currentPassword, req.body.newPassword);
      res.json(ApiResponse.success('Password changed'));
    } catch (err) { next(err); }
  },
  toggleWishlist: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await authService.toggleWishlist(req.user!._id.toString(), req.params.productId);
      res.json(ApiResponse.success('Wishlist updated', result));
    } catch (err) { next(err); }
  },
  getWishlist: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await authService.getWishlist(req.user!._id.toString());
      res.json(ApiResponse.success('Wishlist fetched', result));
    } catch (err) { next(err); }
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT CONTROLLER  (admin manages products directly — no vendor)
// ═══════════════════════════════════════════════════════════════════════════════
export const productController = {
  getProducts: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await productService.getProducts(req.query as Record<string, string>);
      res.json(ApiResponse.success('Products fetched', result));
    } catch (err) { next(err); }
  },
  getFeatured: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const products = await productService.getFeaturedProducts();
      res.json(ApiResponse.success('Featured products', products));
    } catch (err) { next(err); }
  },
  getProductBySlug: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const product = await productService.getProductBySlug(req.params.slug);
      res.json(ApiResponse.success('Product fetched', product));
    } catch (err) { next(err); }
  },
  getRelated: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const products = await productService.getRelatedProducts(req.params.id);
      res.json(ApiResponse.success('Related products', products));
    } catch (err) { next(err); }
  },
  // Admin only — create product (no vendor needed)
  createProduct: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const images = (req.files as Express.Multer.File[]) || [];
      const product = await productService.createProduct(req.body, images);
      res.status(StatusCodes.CREATED).json(ApiResponse.success('Product created', product));
    } catch (err) { next(err); }
  },
  updateProduct: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const images = (req.files as Express.Multer.File[]) || [];
      const product = await productService.updateProduct(req.params.id, req.body, images);
      res.json(ApiResponse.success('Product updated', product));
    } catch (err) { next(err); }
  },
  deleteProduct: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await productService.deleteProduct(req.params.id);
      res.json(ApiResponse.success('Product deleted'));
    } catch (err) { next(err); }
  },
  getLowStock: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const products = await productService.getLowStockProducts();
      res.json(ApiResponse.success('Low stock products', products));
    } catch (err) { next(err); }
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ORDER CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════
export const orderController = {
  getBankDetails: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = orderService.getBankDetails();
      res.json(ApiResponse.success('Bank details', data));
    } catch (err) { next(err); }
  },
  createCheckout: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const order = await orderService.createManualCheckout(
        req.user!._id.toString(), req.body.shippingAddress, req.body.notes
      );
      res.status(StatusCodes.CREATED).json(ApiResponse.success('Order created', order));
    } catch (err) { next(err); }
  },
  uploadPaymentProof: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new Error('No file uploaded');
      const proofUrl = (req.file as Express.Multer.File & { path: string }).path;
      const order = await orderService.uploadPaymentProof(req.params.id, req.user!._id.toString(), proofUrl);
      res.json(ApiResponse.success('Payment proof uploaded', order));
    } catch (err) { next(err); }
  },
  getMyOrders: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await orderService.getMyOrders(req.user!._id.toString(), req.query as Record<string, string>);
      res.json(ApiResponse.success('Orders fetched', result));
    } catch (err) { next(err); }
  },
  getOrderByNumber: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const order = await orderService.getOrderByNumber(req.params.orderNumber, req.user!._id.toString());
      res.json(ApiResponse.success('Order fetched', order));
    } catch (err) { next(err); }
  },
  cancelOrder: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const order = await orderService.cancelOrder(req.params.id, req.user!._id.toString());
      res.json(ApiResponse.success('Order cancelled', order));
    } catch (err) { next(err); }
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CART CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════
export const cartController = {
  getCart: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const cart = await cartService.getCart(req.user!._id.toString());
      res.json(ApiResponse.success('Cart fetched', cart));
    } catch (err) { next(err); }
  },
  addItem: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const cart = await cartService.addItem(req.user!._id.toString(), req.body);
      res.json(ApiResponse.success('Item added', cart));
    } catch (err) { next(err); }
  },
  updateItem: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const cart = await cartService.updateItem(req.user!._id.toString(), req.params.itemId, req.body.quantity);
      res.json(ApiResponse.success('Cart updated', cart));
    } catch (err) { next(err); }
  },
  removeItem: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const cart = await cartService.removeItem(req.user!._id.toString(), req.params.itemId);
      res.json(ApiResponse.success('Item removed', cart));
    } catch (err) { next(err); }
  },
  clearCart: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const cart = await cartService.clearCart(req.user!._id.toString());
      res.json(ApiResponse.success('Cart cleared', cart));
    } catch (err) { next(err); }
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// REVIEW CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════
export const reviewController = {
  getProductReviews: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await reviewService.getProductReviews(req.params.productId, req.query as Record<string, string>);
      res.json(ApiResponse.success('Reviews fetched', result));
    } catch (err) { next(err); }
  },
  createReview: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const review = await reviewService.createReview(
        req.params.productId, req.user!._id.toString(), req.body
      );
      res.status(StatusCodes.CREATED).json(ApiResponse.success('Review created', review));
    } catch (err) { next(err); }
  },
  voteHelpful: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const review = await reviewService.voteHelpful(req.params.reviewId, req.user!._id.toString());
      res.json(ApiResponse.success('Vote recorded', review));
    } catch (err) { next(err); }
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════
export const adminController = {
  getDashboard: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const period = req.query.period as 'today' | 'week' | 'month' | 'year';
      const analytics = await adminAnalyticsService.getPlatformAnalytics(period);
      res.json(ApiResponse.success('Dashboard data', analytics));
    } catch (err) { next(err); }
  },
  getAllUsers: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = getPaginationOptions(req.query as Record<string, string>);
      const query: Record<string, unknown> = {};
      if (req.query.role)    query.role = req.query.role;
      if (req.query.search)  query.$text = { $search: req.query.search as string };
      const skip = (page - 1) * limit;
      const [users, total] = await Promise.all([
        User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        User.countDocuments(query),
      ]);
      res.json(ApiResponse.success('Users fetched', createPaginatedResult(users, total, { page, limit })));
    } catch (err) { next(err); }
  },
  toggleUserStatus: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) throw new Error('User not found');
      user.isActive = !user.isActive;
      await user.save();
      res.json(ApiResponse.success(`User ${user.isActive ? 'activated' : 'deactivated'}`, user));
    } catch (err) { next(err); }
  },
  getAllOrders: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await orderService.getAllOrders(req.query as Record<string, string>);
      res.json(ApiResponse.success('Orders fetched', result));
    } catch (err) { next(err); }
  },
  confirmPayment: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const order = await orderService.confirmPayment(req.params.orderId, req.user!._id.toString());
      res.json(ApiResponse.success('Payment confirmed', order));
    } catch (err) { next(err); }
  },
  rejectPayment: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { reason } = req.body;
      if (!reason) { res.status(400).json({ success: false, message: 'Rejection reason required' }); return; }
      const order = await orderService.rejectPayment(req.params.orderId, req.user!._id.toString(), reason);
      res.json(ApiResponse.success('Payment rejected', order));
    } catch (err) { next(err); }
  },
  getAllCategories: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await Category.find({ isActive: true })
        .populate('children').sort({ sortOrder: 1 });
      res.json(ApiResponse.success('Categories fetched', categories));
    } catch (err) { next(err); }
  },
  createCategory: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const category = await Category.create(req.body);
      res.status(StatusCodes.CREATED).json(ApiResponse.success('Category created', category));
    } catch (err) { next(err); }
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════
export const notificationController = {
  getNotifications: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const notifications = await Notification.find({ user: req.user!._id })
        .sort({ createdAt: -1 }).limit(50);
      res.json(ApiResponse.success('Notifications fetched', notifications));
    } catch (err) { next(err); }
  },
  markAsRead: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await Notification.findOneAndUpdate(
        { _id: req.params.id, user: req.user!._id }, { isRead: true }
      );
      res.json(ApiResponse.success('Notification marked as read'));
    } catch (err) { next(err); }
  },
  markAllAsRead: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await Notification.updateMany({ user: req.user!._id, isRead: false }, { isRead: true });
      res.json(ApiResponse.success('All notifications marked as read'));
    } catch (err) { next(err); }
  },
};
