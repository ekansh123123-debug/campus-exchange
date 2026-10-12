import { z } from 'zod';

export const addWishlistBodySchema = z
  .object({
    listingCode: z.string().trim().min(4).max(40),
  })
  .strict();

export const wishlistListingCodeParamSchema = z.object({
  listingCode: z.string().trim().min(4).max(40),
});
