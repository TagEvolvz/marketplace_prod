import { v4 as uuidv4 } from 'uuid';
import { PaginatedResult } from '../types';

// ─── Slug generation ──────────────────────────────────────────────────────────
export const generateSlug = (text: string): string =>
  text.toLowerCase().trim().replace(/[\s\W-]+/g, '-').replace(/^-+|-+$/g, '');

export const generateUniqueSlug = async (
  name: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> => {
  const base = generateSlug(name);
  let slug  = base;
  let count = 0;
  while (await exists(slug)) {
    count++;
    slug = `${base}-${count}`;
  }
  return slug;
};

// ─── SKU generation ───────────────────────────────────────────────────────────
export const generateSKU = (_storeId: string, productName: string): string => {
  const code   = productName.replace(/\s+/g, '').substring(0, 6).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const ts     = Date.now().toString(36).slice(-3).toUpperCase();
  return `TF-${code}-${random}${ts}`;
};

// ─── Order number generation ──────────────────────────────────────────────────
export const generateOrderNumber = (): string => {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TF-${ts}-${rnd}`;
};

// ─── Pagination ───────────────────────────────────────────────────────────────
export const getPaginationOptions = (
  query: Record<string, string | number | undefined>
): { page: number; limit: number; sort: string; order: string } => ({
  page:  Math.max(1, parseInt(String(query.page  || '1'))),
  limit: Math.min(100, Math.max(1, parseInt(String(query.limit || '20')))),
  sort:  String(query.sort  || 'createdAt'),
  order: String(query.order || 'desc'),
});

export const createPaginatedResult = <T>(
  data: T[],
  total: number,
  { page, limit }: { page: number; limit: number }
): PaginatedResult<T> => {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    data,
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

// ─── Date range helper ────────────────────────────────────────────────────────
export const getDateRange = (
  period: 'today' | 'week' | 'month' | 'year' = 'month'
): { start: Date; end: Date } => {
  const end   = new Date();
  const start = new Date();
  if (period === 'today') { start.setHours(0, 0, 0, 0); }
  else if (period === 'week')  { start.setDate(start.getDate() - 7); }
  else if (period === 'month') { start.setMonth(start.getMonth() - 1); }
  else if (period === 'year')  { start.setFullYear(start.getFullYear() - 1); }
  return { start, end };
};

// ─── Price utilities ──────────────────────────────────────────────────────────
export const calculateDiscountPrice = (
  price: number,
  type: 'percentage' | 'fixed',
  value: number
): number => {
  const discounted = type === 'percentage'
    ? price * (1 - value / 100)
    : price - value;
  return Math.max(0, parseFloat(discounted.toFixed(2)));
};

export const formatCurrency = (amount: number, currency = 'NGN'): string =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(amount);

// ─── Token utilities (for email verification / password reset) ───────────────
import crypto from 'crypto';

export const generateRandomToken = (): string =>
  crypto.randomBytes(32).toString('hex');

export const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');
