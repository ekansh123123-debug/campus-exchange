import { z } from 'zod';

export const createReviewBodySchema = z
  .object({
    rating: z
      .number()
      .int('Rating must be a whole number.')
      .min(1, 'Rating must be between 1 and 5.')
      .max(5, 'Rating must be between 1 and 5.'),
    comment: z.string().trim().max(1000, 'Comment must not exceed 1000 characters.').optional().default(''),
  })
  .strict();

export const transactionCodeParamSchema = z.object({
  transactionCode: z.string().trim().min(4).max(40),
});
