import { z } from 'zod';
import {
  LISTING_CONDITION_VALUES,
  LISTING_SORT_VALUES,
  LISTING_TYPE_VALUES,
} from '../../constants/listing-status.js';

const FORBIDDEN_LISTING_KEYS = [
  'status',
  'sellerId',
  'ownerId',
  'approvedBy',
  'reviewedBy',
  'reservedTransactionId',
  'listingCode',
  'moderation',
  'role',
];

function checkNoForbiddenKeys(obj, ctx) {
  if (!obj || typeof obj !== 'object') return;
  for (const key of FORBIDDEN_LISTING_KEYS) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: `Field "${key}" is server-controlled and cannot be supplied by the client.`,
      });
    }
  }
}

export const createListingBodySchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters.').max(140),
    description: z
      .string()
      .trim()
      .min(10, 'Description must be at least 10 characters.')
      .max(2500),
    categoryId: z.string().trim().optional(),
    categorySlug: z.string().trim().optional(),
    listingType: z.enum(LISTING_TYPE_VALUES),
    price: z.union([z.number(), z.string()]).optional(),
    pricePaise: z.union([z.number(), z.string()]).optional(),
    condition: z.enum(LISTING_CONDITION_VALUES),
    branch: z.string().trim().max(40).optional().default('GENERAL'),
    academicYear: z.string().trim().max(10).optional().default(''),
    semester: z.string().trim().max(10).optional().default(''),
    subject: z.string().trim().max(120).optional().default(''),
    edition: z.string().trim().max(60).optional().default(''),
    author: z.string().trim().max(120).optional().default(''),
    exchangePreference: z.string().trim().max(300).optional().default(''),
  })
  .passthrough()
  .superRefine((val, ctx) => {
    checkNoForbiddenKeys(val, ctx);
    if (!val.categoryId && !val.categorySlug) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['category'],
        message: 'A valid category (categoryId or categorySlug) is required.',
      });
    }
    const hasPrice =
      val.price !== undefined && val.price !== null && String(val.price).trim() !== '';
    const hasPricePaise =
      val.pricePaise !== undefined &&
      val.pricePaise !== null &&
      String(val.pricePaise).trim() !== '';

    if (!hasPrice && !hasPricePaise) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['price'],
        message: 'Price is required (use 0 for free/exchange items).',
      });
      return;
    }

    if (hasPricePaise) {
      const p = Number(val.pricePaise);
      if (!Number.isInteger(p) || p < 0 || p > 100000000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['pricePaise'],
          message: 'pricePaise must be a non-negative integer.',
        });
      }
    } else if (hasPrice) {
      const p = Number(val.price);
      if (!Number.isFinite(p) || p < 0 || p > 1000000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['price'],
          message: 'Price must be a valid non-negative number.',
        });
      }
    }
  });

export const updateListingBodySchema = z
  .object({
    title: z.string().trim().min(3).max(140).optional(),
    description: z.string().trim().min(10).max(2500).optional(),
    categoryId: z.string().trim().optional(),
    categorySlug: z.string().trim().optional(),
    listingType: z.enum(LISTING_TYPE_VALUES).optional(),
    price: z.union([z.number(), z.string()]).optional(),
    pricePaise: z.union([z.number(), z.string()]).optional(),
    condition: z.enum(LISTING_CONDITION_VALUES).optional(),
    branch: z.string().trim().max(40).optional(),
    academicYear: z.string().trim().max(10).optional(),
    semester: z.string().trim().max(10).optional(),
    subject: z.string().trim().max(120).optional(),
    edition: z.string().trim().max(60).optional(),
    author: z.string().trim().max(120).optional(),
    exchangePreference: z.string().trim().max(300).optional(),
  })
  .passthrough()
  .superRefine((val, ctx) => {
    checkNoForbiddenKeys(val, ctx);
    const hasPrice =
      val.price !== undefined && val.price !== null && String(val.price).trim() !== '';
    const hasPricePaise =
      val.pricePaise !== undefined &&
      val.pricePaise !== null &&
      String(val.pricePaise).trim() !== '';

    if (hasPricePaise) {
      const p = Number(val.pricePaise);
      if (!Number.isInteger(p) || p < 0 || p > 100000000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['pricePaise'],
          message: 'pricePaise must be a non-negative integer.',
        });
      }
    }
    if (hasPrice) {
      const p = Number(val.price);
      if (!Number.isFinite(p) || p < 0 || p > 1000000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['price'],
          message: 'Price must be a valid non-negative number.',
        });
      }
    }
  });

export const listingCodeParamSchema = z.object({
  listingCode: z.string().trim().min(4).max(40),
});

export const searchListingsQuerySchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    category: z.string().trim().max(80).optional(),
    branch: z.string().trim().max(40).optional(),
    year: z.string().trim().max(10).optional(),
    academicYear: z.string().trim().max(10).optional(),
    semester: z.string().trim().max(10).optional(),
    subject: z.string().trim().max(120).optional(),
    minPrice: z.coerce.number().min(0).max(1000000).optional(),
    maxPrice: z.coerce.number().min(0).max(1000000).optional(),
    condition: z.enum(LISTING_CONDITION_VALUES).optional(),
    listingType: z.enum(LISTING_TYPE_VALUES).optional(),
    sort: z.enum(LISTING_SORT_VALUES).optional().default('newest'),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .superRefine((val, ctx) => {
    if (
      val.minPrice !== undefined &&
      val.maxPrice !== undefined &&
      val.minPrice > val.maxPrice
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['minPrice'],
        message: 'minPrice cannot be greater than maxPrice.',
      });
    }
  });
