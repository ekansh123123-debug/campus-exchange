import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../../middleware/authenticate.js';
import { requireVerifiedStudent } from '../../middleware/require-verified-student.js';
import { uploadRateLimiter } from '../../middleware/rate-limits.js';
import { singleResourceUpload } from '../../middleware/upload.js';
import { validateRequest } from '../../middleware/validate-request.js';
import {
  downloadResourceController,
  getResourceDetailController,
  listMyResourcesController,
  searchResourcesController,
  uploadResourceController,
} from './resources.controller.js';
import {
  createResourceBodySchema,
  resourceCodeParamSchema,
  searchResourcesQuerySchema,
} from './resources.validation.js';

const router = Router();

router.get(
  '/',
  optionalAuthenticate,
  validateRequest({ query: searchResourcesQuerySchema }),
  searchResourcesController
);

router.get('/mine', authenticate, requireVerifiedStudent, listMyResourcesController);

router.post(
  '/',
  authenticate,
  requireVerifiedStudent,
  uploadRateLimiter,
  singleResourceUpload,
  validateRequest({ body: createResourceBodySchema }),
  uploadResourceController
);

router.get(
  '/:resourceCode',
  optionalAuthenticate,
  validateRequest({ params: resourceCodeParamSchema }),
  getResourceDetailController
);

router.get(
  '/:resourceCode/download',
  authenticate,
  requireVerifiedStudent,
  validateRequest({ params: resourceCodeParamSchema }),
  downloadResourceController
);

export default router;
