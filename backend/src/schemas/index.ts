/**
 * schemas/index.ts — Zod validation schemas
 * Single-store mono marketplace: Pharmacy, Supermarket, Cosmetics
 */
import { z } from 'zod';

// ─── Shared primitives ────────────────────────────────────────────────────────
const objectId    = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID');
const password    = z.string().min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain upper, lower and number');
const pagination  = z.object({
  page:  z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  sort:  z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc').optional(),
});
const address     = z.object({
  street:     z.string().min(1),
  city:       z.string().min(1),
  state:      z.string().optional(),
  country:    z.string().min(1),
  postalCode: z.string().optional(),
});
const storeSection = z.enum(['pharmacy', 'supermarket', 'cosmetics']);

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1).max(50),
    lastName:  z.string().trim().min(1).max(50),
    email:     z.string().trim().email().toLowerCase(),
    password,
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email:    z.string().trim().email().toLowerCase(),
    password: z.string().min(1, 'Password required'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({ email: z.string().trim().email().toLowerCase() }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token:    z.string().min(1),
    email:    z.string().trim().email().toLowerCase(),
    password,
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword:     password,
  }),
});

export const verifyEmailSchema = z.object({
  query: z.object({
    token: z.string().min(1),
    email: z.string().trim().email().toLowerCase(),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1).max(50).optional(),
    lastName:  z.string().trim().min(1).max(50).optional(),
    phone:     z.string().optional(),
  }),
});

// ─── Product ───────────────────────────────────────────────────────────────────
export const createProductSchema = z.object({
  body: z.object({
    name:                 z.string().trim().min(1).max(200),
    description:          z.string().trim().min(5),
    shortDescription:     z.string().trim().max(500).optional(),
    price:                z.coerce.number().min(0),
    compareAtPrice:       z.coerce.number().min(0).optional(),
    stock:                z.coerce.number().int().min(0),
    lowStockThreshold:    z.coerce.number().int().min(0).default(5).optional(),
    category:             objectId,
    subcategory:          objectId.optional(),
    storeSection:         storeSection.optional(),
    prescriptionRequired: z.union([z.boolean(), z.string()]).transform(v => v === true || v === 'true').optional(),
    tags:                 z.union([z.string(), z.array(z.string())]).optional(),
    isFeatured:           z.union([z.boolean(), z.string()]).transform(v => v === true || v === 'true').optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({ id: objectId }),
  body:   createProductSchema.shape.body.partial(),
});

export const productQuerySchema = z.object({
  query: pagination.extend({
    category:             objectId.optional(),
    subcategory:          objectId.optional(),
    storeSection:         storeSection.optional(),
    minPrice:             z.coerce.number().min(0).optional(),
    maxPrice:             z.coerce.number().min(0).optional(),
    rating:               z.coerce.number().min(1).max(5).optional(),
    search:               z.string().trim().max(200).optional(),
    status:               z.string().optional(),
    featured:             z.string().optional(),
    prescriptionRequired: z.string().optional(),
  }),
});

// ─── Cart ──────────────────────────────────────────────────────────────────────
export const addCartItemSchema = z.object({
  body: z.object({
    productId: objectId,
    quantity:  z.coerce.number().int().min(1).max(50),
  }),
});

export const updateCartItemSchema = z.object({
  params: z.object({ itemId: objectId }),
  body:   z.object({ quantity: z.coerce.number().int().min(0).max(50) }),
});

// ─── Order ─────────────────────────────────────────────────────────────────────
export const checkoutSchema = z.object({
  body: z.object({
    shippingAddress: address,
    notes:           z.string().max(500).optional(),
  }),
});

export const orderQuerySchema = z.object({
  query: pagination.extend({
    status:        z.string().optional(),
    paymentStatus: z.string().optional(),
  }),
});

// ─── Review ────────────────────────────────────────────────────────────────────
export const createReviewSchema = z.object({
  params: z.object({ productId: objectId }),
  body: z.object({
    rating:  z.coerce.number().int().min(1).max(5),
    comment: z.string().trim().min(5).max(2000),
    title:   z.string().trim().max(100).optional(),
  }),
});

// ─── Category ──────────────────────────────────────────────────────────────────
export const createCategorySchema = z.object({
  body: z.object({
    name:         z.string().trim().min(1).max(100),
    storeSection,
    description:  z.string().trim().max(500).optional(),
    icon:         z.string().optional(),
    parent:       objectId.optional(),
    sortOrder:    z.coerce.number().int().optional(),
  }),
});

// ─── Admin ─────────────────────────────────────────────────────────────────────
export const userIdParamSchema = z.object({
  params: z.object({ userId: objectId }),
});
