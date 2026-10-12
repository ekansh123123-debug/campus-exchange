import { z } from 'zod';
import { LISTING_STATUS_VALUES } from '../../constants/listing-status.js';
import { RESOURCE_STATUS_VALUES } from '../../constants/resource-status.js';
import { REPORT_STATUS_VALUES } from '../../constants/upload-limits.js';
import { ACCOUNT_STATUS_VALUES } from '../../constants/account-status.js';

export const moderationReasonBodySchema = z
  .object({
    reason: z
      .string()
      .trim()
      .min(3, 'A clear reason (minimum 3 characters) is required for this moderation action.')
      .max(500),
  })
  .strict();

export const optionalNoteBodySchema = z
  .object({
    note: z.string().trim().max(500).optional().default(''),
    reason: z.string().trim().max(500).optional().default(''),
  })
  .strict();

export const adminListingsQuerySchema = z.object({
  status: z.enum([...LISTING_STATUS_VALUES, 'all']).optional().default('pending'),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const adminResourcesQuerySchema = z.object({
  status: z.enum([...RESOURCE_STATUS_VALUES, 'all']).optional().default('pending'),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const adminUsersQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  accountStatus: z.enum(ACCOUNT_STATUS_VALUES).optional(),
  branch: z.string().trim().max(40).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const adminReportsQuerySchema = z.object({
  status: z.enum(REPORT_STATUS_VALUES).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const listingCodeParamSchema = z.object({
  listingCode: z.string().trim().min(4).max(40),
});

export const resourceCodeParamSchema = z.object({
  resourceCode: z.string().trim().min(4).max(40),
});

export const userCodeParamSchema = z.object({
  userCode: z.string().trim().min(4).max(40),
});

export const reportCodeParamSchema = z.object({
  reportCode: z.string().trim().min(4).max(40),
});
