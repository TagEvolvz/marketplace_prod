/**
 * cache.ts
 *
 * Thin wrapper around the Redis client that enforces:
 *   - Consistent key namespacing  (namespace:resource:id)
 *   - Explicit TTL constants      (one place to tune expiry)
 *   - Group invalidation          (clear all keys matching a prefix)
 *   - Typed helpers               (no JSON.parse scattered across services)
 *
 * Import from here, NOT directly from config/redis.ts.
 */

import { cacheGet, cacheSet, cacheDel, cacheDelPattern } from '../config/redis';
import logger from '../utils/logger';

// ─── TTL constants (seconds) ──────────────────────────────────────────────────

export const TTL = {
  PRODUCT_LIST: 5 * 60,       // 5 min — public browse, invalidated on create/update
  PRODUCT_DETAIL: 10 * 60,    // 10 min — single product
  FEATURED_PRODUCTS: 15 * 60, // 15 min — homepage
  VENDOR_STORE: 10 * 60,      // 10 min — public store page
  VENDOR_ANALYTICS: 2 * 60,   // 2 min  — dashboard counters
  CATEGORIES: 60 * 60,        // 1 hr   — rarely changes
  ADMIN_DASHBOARD: 60,        // 60 s   — counters
  USER_SESSION: 15 * 60,      // 15 min — user profile
} as const;

// ─── Key builders ─────────────────────────────────────────────────────────────
// All keys follow the pattern:  namespace:resource:discriminator
// This makes pattern-based invalidation predictable.

export const CacheKey = {
  productList: (fingerprint: string) => `products:list:${fingerprint}`,
  productDetail: (slug: string) => `products:detail:${slug}`,
  featuredProducts: () => 'products:featured',
  relatedProducts: (id: string) => `products:related:${id}`,
  vendorStore: (slug: string) => `vendors:store:${slug}`,
  vendorAnalytics: (vendorId: string) => `vendors:analytics:${vendorId}`,
  vendorProducts: (vendorId: string, fingerprint: string) =>
    `vendors:products:${vendorId}:${fingerprint}`,
  categories: () => 'categories:all',
  adminDashboard: () => 'admin:dashboard',
  userProfile: (userId: string) => `users:profile:${userId}`,
} as const;

// ─── Typed read / write ───────────────────────────────────────────────────────

export async function readCache<T>(key: string): Promise<T | null> {
  try {
    return await cacheGet<T>(key);
  } catch (err) {
    logger.warn('Cache read failed', { key, error: (err as Error).message });
    return null;
  }
}

export async function writeCache(key: string, value: unknown, ttl: number): Promise<void> {
  try {
    await cacheSet(key, value, ttl);
  } catch (err) {
    logger.warn('Cache write failed', { key, error: (err as Error).message });
  }
}

export async function invalidateKey(key: string): Promise<void> {
  try {
    await cacheDel(key);
  } catch (err) {
    logger.warn('Cache invalidation failed', { key, error: (err as Error).message });
  }
}

/**
 * Invalidate all keys whose name starts with `prefix`.
 * Use after mutations that affect a group of cached queries.
 *
 * Example:
 *   await invalidateGroup('products:list:')  // after any product create/update/delete
 *   await invalidateGroup('vendors:products:abc123:')  // after vendor product change
 */
export async function invalidateGroup(prefix: string): Promise<void> {
  try {
    await cacheDelPattern(`${prefix}*`);
  } catch (err) {
    logger.warn('Cache group invalidation failed', { prefix, error: (err as Error).message });
  }
}

// ─── Convenience: cache-aside wrapper ────────────────────────────────────────

/**
 * Standard cache-aside: return cached value if present, otherwise call
 * `fetcher`, cache the result, and return it.
 *
 * Usage:
 *   const data = await withCache(CacheKey.categories(), TTL.CATEGORIES, () =>
 *     Category.find().lean()
 *   );
 */
export async function withCache<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await readCache<T>(key);
  if (cached !== null) return cached;

  const fresh = await fetcher();
  await writeCache(key, fresh, ttl);
  return fresh;
}
