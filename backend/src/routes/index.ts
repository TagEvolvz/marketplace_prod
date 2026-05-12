/**
 * routes/index.ts — Single-store API routes
 * Mono marketplace: Pharmacy + Supermarket + Cosmetics
 * No vendor routing. Admin manages everything.
 */

import { Router, Request, Response, NextFunction } from 'express';
import {
  authController, productController, orderController,
  cartController, reviewController, adminController, notificationController,
} from '../controllers/index';
import { authenticate, authorize, authLimiter, strictLimiter } from '../middleware/index';
import { zodValidate } from '../middleware/zodValidate';
import { uploadProductImages, uploadAvatar, uploadPaymentProof } from '../config/cloudinary';
import {
  registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema,
  changePasswordSchema, verifyEmailSchema, updateProfileSchema,
  createProductSchema, updateProductSchema, productQuerySchema,
  addCartItemSchema, updateCartItemSchema, checkoutSchema, orderQuerySchema,
  createReviewSchema, createCategorySchema, userIdParamSchema,
} from '../schemas/index';
import { ApiResponse } from '../utils/ApiError';
import { Category } from '../models/index';
import aiService from '../services/ai.service';

const router = Router();

// ─── Auth ──────────────────────────────────────────────────────────────────────
const authRouter = Router();
authRouter.post('/register',        authLimiter,   zodValidate(registerSchema),        authController.register);
authRouter.post('/login',           authLimiter,   zodValidate(loginSchema),           authController.login);
authRouter.post('/refresh-token',                                                      authController.refreshToken);
authRouter.post('/logout',          authenticate,                                      authController.logout);
authRouter.get('/verify-email',                    zodValidate(verifyEmailSchema),      authController.verifyEmail);
authRouter.post('/forgot-password', strictLimiter, zodValidate(forgotPasswordSchema),  authController.forgotPassword);
authRouter.post('/reset-password',                 zodValidate(resetPasswordSchema),   authController.resetPassword);
authRouter.get('/me',               authenticate,                                      authController.getMe);
authRouter.put('/me',               authenticate,  uploadAvatar.single('avatar'), zodValidate(updateProfileSchema), authController.updateProfile);
authRouter.put('/change-password',  authenticate,  zodValidate(changePasswordSchema),  authController.changePassword);
authRouter.post('/wishlist/:productId', authenticate,                                  authController.toggleWishlist);
authRouter.get('/wishlist',         authenticate,                                      authController.getWishlist);

// ─── Products ──────────────────────────────────────────────────────────────────
const productRouter = Router();
productRouter.get('/',                  zodValidate(productQuerySchema), productController.getProducts);
productRouter.get('/featured',                                           productController.getFeatured);
productRouter.get('/low-stock',         authenticate, authorize('admin'), productController.getLowStock);
productRouter.get('/:slug',                                              productController.getProductBySlug);
productRouter.get('/:id/related',                                        productController.getRelated);
productRouter.get('/:productId/reviews',                                 reviewController.getProductReviews);
productRouter.post('/:productId/reviews', authenticate, zodValidate(createReviewSchema), reviewController.createReview);

// ─── Orders ────────────────────────────────────────────────────────────────────
const orderRouter = Router();
orderRouter.get('/bank-details',                                                                       orderController.getBankDetails);
orderRouter.post('/checkout',          authenticate, zodValidate(checkoutSchema),                      orderController.createCheckout);
orderRouter.post('/:id/upload-proof',  authenticate, uploadPaymentProof.single('proof'),              orderController.uploadPaymentProof);
orderRouter.get('/my-orders',          authenticate, zodValidate(orderQuerySchema),                    orderController.getMyOrders);
orderRouter.get('/my-orders/:orderNumber', authenticate,                                               orderController.getOrderByNumber);
orderRouter.post('/my-orders/:id/cancel', authenticate,                                                orderController.cancelOrder);

// ─── Cart ──────────────────────────────────────────────────────────────────────
const cartRouter = Router();
cartRouter.get('/',                    authenticate,                                cartController.getCart);
cartRouter.post('/items',              authenticate, zodValidate(addCartItemSchema), cartController.addItem);
cartRouter.put('/items/:itemId',       authenticate, zodValidate(updateCartItemSchema), cartController.updateItem);
cartRouter.delete('/items/:itemId',    authenticate,                                cartController.removeItem);
cartRouter.delete('/',                 authenticate,                                cartController.clearCart);

// ─── Notifications ─────────────────────────────────────────────────────────────
const notifRouter = Router();
notifRouter.get('/',                   authenticate,  notificationController.getNotifications);
notifRouter.put('/:id/read',           authenticate,  notificationController.markAsRead);
notifRouter.put('/read-all',           authenticate,  notificationController.markAllAsRead);

// ─── Categories (public) ───────────────────────────────────────────────────────
const categoryRouter = Router();
categoryRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cats = await Category.find({ parent: null, isActive: true })
      .populate('children')
      .sort({ sortOrder: 1 })
      .lean();
    res.json(ApiResponse.success('Categories', cats));
  } catch (err) { next(err); }
});
categoryRouter.get('/by-section/:section', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cats = await Category.find({ storeSection: req.params.section, isActive: true })
      .populate('children')
      .sort({ sortOrder: 1 })
      .lean();
    res.json(ApiResponse.success('Categories', cats));
  } catch (err) { next(err); }
});
categoryRouter.post('/', authenticate, authorize('admin'), zodValidate(createCategorySchema), adminController.createCategory);

// ─── Admin ─────────────────────────────────────────────────────────────────────
const adminRouter = Router();
adminRouter.use(authenticate, authorize('admin'));

// Dashboard
adminRouter.get('/dashboard',                                                    adminController.getDashboard);

// Users
adminRouter.get('/users',                                                        adminController.getAllUsers);
adminRouter.put('/users/:userId/toggle-status', zodValidate(userIdParamSchema), adminController.toggleUserStatus);

// Products — admin manages all products directly
adminRouter.get('/products',      zodValidate(productQuerySchema),               productController.getProducts);
adminRouter.post('/products',     uploadProductImages.array('images', 10), zodValidate(createProductSchema), productController.createProduct);
adminRouter.put('/products/:id',  uploadProductImages.array('images', 10), zodValidate(updateProductSchema), productController.updateProduct);
adminRouter.delete('/products/:id',                                              productController.deleteProduct);
adminRouter.post('/products/:id/restock', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productService = (await import('../services/product.service')).default;
    const product = await productService.restockProduct(req.params.id, parseInt(req.body.quantity) || 0);
    res.json(ApiResponse.success('Product restocked', product));
  } catch (err) { next(err); }
});

// Orders
adminRouter.get('/orders',                                                              adminController.getAllOrders);
adminRouter.patch('/orders/:orderId/confirm-payment',                                   adminController.confirmPayment);
adminRouter.patch('/orders/:orderId/reject-payment',                                    adminController.rejectPayment);
adminRouter.patch('/orders/:orderId/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderService = (await import('../services/order.service')).default;
    const order = await orderService.updateOrderStatus(req.params.orderId, req.body.status, req.body.note);
    res.json(ApiResponse.success('Order status updated', order));
  } catch (err) { next(err); }
});

// Categories admin
adminRouter.get('/categories',                                                          adminController.getAllCategories);
adminRouter.post('/categories', zodValidate(createCategorySchema),                     adminController.createCategory);

// AI insights (admin only)
adminRouter.get('/ai/inventory-insights', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const insights = await aiService.inventoryInsights();
    res.json(ApiResponse.success('AI inventory insights', insights));
  } catch (err) { next(err); }
});

// ─── AI (proxied — key never exposed to browser) ──────────────────────────────
const aiRouter = Router();
aiRouter.post('/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messages, context } = req.body;
    if (!messages?.length) { res.status(400).json({ success: false, message: 'Messages required' }); return; }
    const reply = await aiService.chat(messages, context);
    res.json(ApiResponse.success('AI response', { reply }));
  } catch (err) { next(err); }
});
aiRouter.post('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = req.body;
    if (!query?.trim()) { res.status(400).json({ success: false, message: 'Query required' }); return; }
    const result = await aiService.smartSearch(query);
    res.json(ApiResponse.success('Search results', result));
  } catch (err) { next(err); }
});
aiRouter.post('/generate-description', authenticate, authorize('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const description = await aiService.generateDescription(req.body);
    res.json(ApiResponse.success('Description generated', { description }));
  } catch (err) { next(err); }
});

// ─── Mount all routers ─────────────────────────────────────────────────────────
router.use('/auth',          authRouter);
router.use('/products',      productRouter);
router.use('/orders',        orderRouter);
router.use('/cart',          cartRouter);
router.use('/notifications', notifRouter);
router.use('/categories',    categoryRouter);
router.use('/admin',         adminRouter);
router.use('/ai',            aiRouter);

// ─── Health check ──────────────────────────────────────────────────────────────
router.get('/health', (_req, res) => {
  res.json({
    success:     true,
    message:     'FLOW API is running',
    environment: process.env.NODE_ENV,
    timestamp:   new Date().toISOString(),
    store:       'Pharmacy | Supermarket | Cosmetics',
  });
});

export default router;
