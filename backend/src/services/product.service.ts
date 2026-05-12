/**
 * product.service.ts — Single-store product management
 * Admin owns all products. No vendor association.
 */

import { Types } from 'mongoose';
import { Product } from '../models/Product';
import { Category } from '../models/index';
import { ApiError } from '../utils/ApiError';
import { getPaginationOptions, createPaginatedResult, generateUniqueSlug, generateSKU } from '../utils/helpers';
import { deleteCloudinaryImage } from '../config/cloudinary';
import { IProduct, PaginatedResult } from '../types';
import logger from '../utils/logger';
import { withCache, invalidateKey, invalidateGroup, CacheKey, TTL } from '../config/cache';

interface ProductFilters {
  page?: string | number;
  limit?: string | number;
  sort?: string;
  order?: string;
  category?: string;
  subcategory?: string;
  storeSection?: string;
  minPrice?: string | number;
  maxPrice?: string | number;
  rating?: string | number;
  search?: string;
  tags?: string;
  status?: string;
  featured?: string | boolean;
  prescriptionRequired?: string | boolean;
}

export class ProductService {
  // ─── Public product listing ───────────────────────────────────────────────
  async getProducts(filters: ProductFilters): Promise<PaginatedResult<IProduct>> {
    const { page, limit, sort, order } = getPaginationOptions(filters as Record<string, string>);
    const fingerprint = JSON.stringify(
      Object.fromEntries(Object.entries(filters).sort(([a], [b]) => a.localeCompare(b)))
    );
    const key = CacheKey.productList(fingerprint);

    return withCache(key, TTL.PRODUCT_LIST, async () => {
      const query: Record<string, unknown> = {};

      // By default only show active and out_of_stock to customers
      if (!filters.status || filters.status === 'active') {
        query.status = { $in: ['active', 'out_of_stock'] };
      } else if (filters.status === 'all') {
        query.status = { $ne: 'deleted' };
      } else {
        query.status = filters.status;
      }

      if (filters.storeSection)                           query.storeSection = filters.storeSection;
      if (filters.category)                               query.category     = new Types.ObjectId(filters.category as string);
      if (filters.subcategory)                            query.subcategory  = new Types.ObjectId(filters.subcategory as string);
      if (filters.featured === 'true' || filters.featured === true) query.isFeatured = true;
      if (filters.prescriptionRequired === 'true')        query.prescriptionRequired = true;
      if (filters.tags)                                   query.tags = { $in: (filters.tags as string).split(',').map((t) => t.trim()) };
      if (filters.rating)                                 query.rating = { $gte: Number(filters.rating) };

      if (filters.minPrice || filters.maxPrice) {
        query.price = {} as Record<string, number>;
        if (filters.minPrice) (query.price as Record<string, number>).$gte = Number(filters.minPrice);
        if (filters.maxPrice) (query.price as Record<string, number>).$lte = Number(filters.maxPrice);
      }

      if (filters.search) {
        query.$or = [
          { name:        { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } },
          { tags:        { $in:  [new RegExp(filters.search as string, 'i')] } },
        ];
      }

      const validSorts = ['price', 'rating', 'totalSold', 'createdAt', 'name'];
      const sortField = validSorts.includes(sort || '') ? sort! : 'createdAt';
      const sortObj: Record<string, 1 | -1> = { [sortField]: order === 'asc' ? 1 : -1 };
      const skip = (page - 1) * limit;

      const [products, total] = await Promise.all([
        Product.find(query)
          .populate('category', 'name slug storeSection')
          .populate('subcategory', 'name slug')
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .lean(),
        Product.countDocuments(query),
      ]);

      return createPaginatedResult(products as unknown as IProduct[], total, { page, limit });
    });
  }

  // ─── Single product by slug ───────────────────────────────────────────────
  async getProductBySlug(slug: string): Promise<IProduct> {
    return withCache(CacheKey.productDetail(slug), TTL.PRODUCT_DETAIL, async () => {
      const product = await Product.findOne({ slug, status: { $ne: 'deleted' } })
        .populate('category', 'name slug storeSection')
        .populate('subcategory', 'name slug');
      if (!product) throw ApiError.notFound('Product not found');
      // Non-blocking view count
      Product.findByIdAndUpdate(product._id, { $inc: { views: 1 } }).exec().catch(() => null);
      return product.toObject() as unknown as IProduct;
    });
  }

  async getProductById(id: string): Promise<IProduct> {
    const product = await Product.findById(id)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug');
    if (!product) throw ApiError.notFound('Product not found');
    return product as unknown as IProduct;
  }

  // ─── Admin: create product ────────────────────────────────────────────────
  async createProduct(
    payload: Record<string, unknown>,
    imageFiles: Express.Multer.File[]
  ): Promise<IProduct> {
    if (payload.category) {
      const cat = await Category.findById(payload.category);
      if (!cat) throw ApiError.badRequest('Category not found');
      // Auto-set storeSection from category if not provided
      if (!payload.storeSection) payload.storeSection = cat.storeSection;
    }

    const slug = await generateUniqueSlug(
      payload.name as string,
      async (s) => !!(await Product.findOne({ slug: s }))
    );
    const sku = generateSKU('STORE', payload.name as string);

    const images = imageFiles.map((file, index) => ({
      url:       (file as Express.Multer.File & { path: string }).path,
      publicId:  (file as Express.Multer.File & { filename: string }).filename || '',
      alt:       payload.name as string,
      isPrimary: index === 0,
    }));

    const product = await Product.create({ ...payload, slug, sku, images });

    await Promise.all([
      invalidateGroup('products:list:'),
      invalidateKey(CacheKey.featuredProducts()),
    ]);

    logger.info('Product created', { productId: product._id.toString(), name: product.name });
    return product as unknown as IProduct;
  }

  // ─── Admin: update product ────────────────────────────────────────────────
  async updateProduct(
    productId: string,
    updates: Record<string, unknown>,
    newImageFiles?: Express.Multer.File[]
  ): Promise<IProduct> {
    const product = await Product.findOne({ _id: productId, status: { $ne: 'deleted' } });
    if (!product) throw ApiError.notFound('Product not found');

    if (updates.name && updates.name !== product.name) {
      updates.slug = await generateUniqueSlug(
        updates.name as string,
        async (s) => !!(await Product.findOne({ slug: s, _id: { $ne: productId } }))
      );
    }

    if (newImageFiles?.length) {
      const newImages = newImageFiles.map((file, i) => ({
        url:      (file as Express.Multer.File & { path: string }).path,
        publicId: (file as Express.Multer.File & { filename: string }).filename || '',
        alt:      (updates.name as string) || product.name,
        isPrimary: !product.images?.length && i === 0,
      }));
      updates.images = [...(product.images || []), ...newImages];
    }

    const updated = await Product.findByIdAndUpdate(productId, updates, { new: true, runValidators: true });

    await Promise.all([
      invalidateKey(CacheKey.productDetail(product.slug)),
      invalidateGroup('products:list:'),
    ]);

    return updated as unknown as IProduct;
  }

  // ─── Admin: delete (soft) ─────────────────────────────────────────────────
  async deleteProduct(productId: string): Promise<void> {
    const product = await Product.findOne({ _id: productId, status: { $ne: 'deleted' } });
    if (!product) throw ApiError.notFound('Product not found');

    product.status = 'deleted' as any;
    await product.save();

    await Promise.all([
      invalidateKey(CacheKey.productDetail(product.slug)),
      invalidateGroup('products:list:'),
    ]);

    logger.info('Product soft-deleted', { productId });
  }

  // ─── Featured products ────────────────────────────────────────────────────
  async getFeaturedProducts(limit = 12): Promise<IProduct[]> {
    return withCache(CacheKey.featuredProducts(), TTL.FEATURED_PRODUCTS, async () => {
      return Product.find({ isFeatured: true, status: 'active' })
        .populate('category', 'name slug storeSection')
        .sort({ totalSold: -1 })
        .limit(limit)
        .lean() as unknown as Promise<IProduct[]>;
    });
  }

  // ─── Related products ─────────────────────────────────────────────────────
  async getRelatedProducts(productId: string, limit = 6): Promise<IProduct[]> {
    const product = await Product.findById(productId);
    if (!product) return [];
    return Product.find({
      _id: { $ne: productId },
      category: product.category,
      status: 'active',
    })
      .populate('category', 'name')
      .sort({ rating: -1, totalSold: -1 })
      .limit(limit)
      .lean() as unknown as Promise<IProduct[]>;
  }

  // ─── Update stock (used by order service) ────────────────────────────────
  async updateStock(productId: string, quantity: number): Promise<void> {
    const product = await Product.findByIdAndUpdate(
      productId,
      { $inc: { stock: -quantity, totalSold: quantity } },
      { new: true }
    );
    if (product && product.stock <= 0) {
      await Product.findByIdAndUpdate(productId, { status: 'out_of_stock' });
    }
    // Invalidate cache after stock change
    const p = await Product.findById(productId);
    if (p) await invalidateKey(CacheKey.productDetail(p.slug));
  }

  // ─── Admin: restock ───────────────────────────────────────────────────────
  async restockProduct(productId: string, quantity: number): Promise<IProduct> {
    const product = await Product.findById(productId);
    if (!product) throw ApiError.notFound('Product not found');
    product.stock += quantity;
    if (product.status === 'out_of_stock' && product.stock > 0) {
      product.status = 'active' as any;
    }
    await product.save();
    await invalidateKey(CacheKey.productDetail(product.slug));
    return product as unknown as IProduct;
  }

  // ─── Low stock alert list ─────────────────────────────────────────────────
  async getLowStockProducts(): Promise<IProduct[]> {
    return Product.find({
      status: { $ne: 'deleted' },
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    })
      .populate('category', 'name storeSection')
      .lean() as unknown as Promise<IProduct[]>;
  }
}

export default new ProductService();
