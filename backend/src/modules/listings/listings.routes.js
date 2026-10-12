import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../../middleware/authenticate.js';
import { requireVerifiedStudent } from '../../middleware/require-verified-student.js';
import { uploadRateLimiter } from '../../middleware/rate-limits.js';
import { listingImageUpload } from '../../middleware/upload.js';
import { validateRequest } from '../../middleware/validate-request.js';
import {
  createExchangeRequestController,
  reserveListingController,
} from '../transactions/transactions.controller.js';
import {
  createExchangeRequestBodySchema,
  reserveListingBodySchema,
} from '../transactions/transactions.validation.js';
import {
  createListingController,
  getListingDetailController,
  listMyListingsController,
  removeListingController,
  searchListingsController,
  submitListingController,
  updateListingController,
} from './listings.controller.js';
import {
  createListingBodySchema,
  listingCodeParamSchema,
  searchListingsQuerySchema,
  updateListingBodySchema,
} from './listings.validation.js';

const router = Router();

router.get(
  '/',
  optionalAuthenticate,
  validateRequest({ query: searchListingsQuerySchema }),
  searchListingsController
);

router.get('/mine', authenticate, requireVerifiedStudent, listMyListingsController);

router.post(
  '/',
  authenticate,
  requireVerifiedStudent,
  uploadRateLimiter,
  listingImageUpload,
  validateRequest({ body: createListingBodySchema }),
  createListingController
);

router.get(
  '/:listingCode',
  optionalAuthenticate,
  validateRequest({ params: listingCodeParamSchema }),
  getListingDetailController
);

router.use(authenticate, requireVerifiedStudent);

router.patch(
  '/:listingCode',
  uploadRateLimiter,
  listingImageUpload,
  validateRequest({
    params: listingCodeParamSchema,
    body: updateListingBodySchema,
  }),
  updateListingController
);

router.post(
  '/:listingCode/submit',
  validateRequest({ params: listingCodeParamSchema }),
  submitListingController
);

router.delete(
  '/:listingCode',
  validateRequest({ params: listingCodeParamSchema }),
  removeListingController
);

router.post(
  '/:listingCode/reservations',
  validateRequest({
    params: listingCodeParamSchema,
    body: reserveListingBodySchema,
  }),
  reserveListingController
);

router.post(
  '/:listingCode/exchange-requests',
  validateRequest({
    params: listingCodeParamSchema,
    body: createExchangeRequestBodySchema,
  }),
  createExchangeRequestController
);

export default router;
