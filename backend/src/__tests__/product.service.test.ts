import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { Vendor } from '../models/Vendor';
import { User } from '../models/User';
import { Category } from '../models/index';
import productService from '../services/product.service';

vi.mock('../config/redis', () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(null),
  cacheDel: vi.fn().mockResolvedValue(null),
  cacheDelPattern: vi.fn().mockResolvedValue(null),
}));

const MONGO_URI = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/marketplace_test';

let vendorId: string;
let categoryId: string;

beforeAll(async () => {
  await mongoose.connect(MONGO_URI);

  const user = await User.create({
    firstName: 'Test', lastName: 'Vendor', email: 'vendor-product@test.com',
    password: 'Password123', role: 'vendor', isEmailVerified: true,
  });

  const vendor = await Vendor.create({
    user: user._id, storeName: 'Test Store', storeSlug: 'test-store',
    description: 'A test store for unit tests', businessEmail: 'store@test.com', status: 'approved',
  });
  vendorId = vendor._id.toString();

  const category = await Category.create({ name: 'Test Category', slug: 'test-category', storeSection: 'pharmacy' });
  categoryId = category._id.toString();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

beforeEach(async () => {
  await Product.deleteMany({});
});

describe('ProductService.getProducts', () => {
  beforeEach(async () => {
    await Product.create([
      { name: 'Product A', slug: 'product-a', price: 10, stock: 5, vendor: vendorId, category: categoryId, description: 'Desc A', sku: 'SKU-A', status: 'active' },
      { name: 'Product B', slug: 'product-b', price: 25, stock: 10, vendor: vendorId, category: categoryId, description: 'Desc B', sku: 'SKU-B', status: 'active' },
      { name: 'Product C', slug: 'product-c', price: 50, stock: 0, vendor: vendorId, category: categoryId, description: 'Desc C', sku: 'SKU-C', status: 'out_of_stock' },
    ]);
  });

  it('returns paginated products', async () => {
    const result = await productService.getProducts({ page: '1', limit: '10' });
    expect(result.data).toHaveLength(3);
    expect(result.pagination.total).toBe(3);
  });

  it('filters by min/max price', async () => {
    const result = await productService.getProducts({ minPrice: '20', maxPrice: '30' });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('Product B');
  });

  it('returns only active and out_of_stock (not deleted)', async () => {
    await Product.create({ name: 'Deleted Product', slug: 'deleted-p', price: 5, stock: 0, vendor: vendorId, category: categoryId, description: 'X', sku: 'SKU-DEL', status: 'deleted' });
    const result = await productService.getProducts({});
    expect(result.data.find((p) => p.name === 'Deleted Product')).toBeUndefined();
  });
});

describe('ProductService.getProductBySlug', () => {
  it('returns product by slug', async () => {
    await Product.create({ name: 'Slug Test', slug: 'slug-test', price: 99, stock: 5, vendor: vendorId, category: categoryId, description: 'Test', sku: 'SKU-SLG', status: 'active' });
    const product = await productService.getProductBySlug('slug-test');
    expect(product.name).toBe('Slug Test');
    expect(product.price).toBe(99);
  });

  it('throws 404 for non-existent slug', async () => {
    await expect(productService.getProductBySlug('does-not-exist')).rejects.toThrow();
  });
});

describe('ProductService.getLowStockProducts', () => {
  it('returns products at or below low stock threshold', async () => {
    await Product.create([
      { name: 'Low Stock', slug: 'low-s', price: 10, stock: 3, lowStockThreshold: 5, vendor: vendorId, category: categoryId, description: 'Low', sku: 'SKU-LOW', status: 'active' },
      { name: 'Good Stock', slug: 'good-s', price: 10, stock: 50, lowStockThreshold: 5, vendor: vendorId, category: categoryId, description: 'Good', sku: 'SKU-GOOD', status: 'active' },
    ]);
    const products = await productService.getLowStockProducts(vendorId);
    expect(products).toHaveLength(1);
    expect(products[0].name).toBe('Low Stock');
  });
});

describe('ProductService.updateStock', () => {
  it('decrements stock and increments totalSold', async () => {
    const product = await Product.create({ name: 'Stock Test', slug: 'stock-t', price: 20, stock: 100, totalSold: 0, vendor: vendorId, category: categoryId, description: 'Stock', sku: 'SKU-STK', status: 'active' });
    await productService.updateStock(product._id.toString(), 5);
    const updated = await Product.findById(product._id);
    expect(updated!.stock).toBe(95);
    expect(updated!.totalSold).toBe(5);
  });
});
