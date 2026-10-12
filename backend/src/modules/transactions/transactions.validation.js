import { z } from 'zod';
import {
  TRANSACTION_STATUS_VALUES,
  TRANSACTION_TYPE_VALUES,
} from '../../constants/transaction-status.js';

export const reserveListingBodySchema = z
  .object({
    notes: z.string().trim().max(600).optional().default(''),
  })
  .strict();

export const createExchangeRequestBodySchema = z
  .object({
    offeredListingCode: z.string().trim().min(4).max(40).optional(),
    notes: z.string().trim().max(600).optional().default(''),
  })
  .strict();

export const transactionActionBodySchema = z
  .object({
    reason: z.string().trim().max(500).optional().default(''),
    notes: z.string().trim().max(600).optional().default(''),
  })
  .strict();

export const transactionCodeParamSchema = z.object({
  transactionCode: z.string().trim().min(4).max(40),
});

export const listTransactionsQuerySchema = z.object({
  role: z.enum(['buyer', 'seller', 'all']).optional().default('all'),
  status: z.enum(TRANSACTION_STATUS_VALUES).optional(),
  txnType: z.enum(TRANSACTION_TYPE_VALUES).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
