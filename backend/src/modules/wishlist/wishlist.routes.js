import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireVerifiedStudent } from '../../middleware/require-verified-student.js';
import { validateRequest } from '../../middleware/validate-request.js';
import {
  addWishlistController,
  listWishlistController,
  removeWishlistController,
} from './wishlist.controller.js';
import {
  addWishlistBodySchema,
  wishlistListingCodeParamSchema,
} from './wishlist.validation.js';

const router = Router();

router.use(authenticate, requireVerifiedStudent);

router.get('/', listWishlistController);

router.post(
  '/',
  validateRequest({ body: addWishlistBodySchema }),
  addWishlistController
);

router.delete(
  '/:listingCode',
  validateRequest({ params: wishlistListingCodeParamSchema }),
  removeWishlistController
);

export default router;
