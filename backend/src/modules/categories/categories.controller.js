import { asyncHandler } from '../../utils/async-handler.js';
import { sendSuccess } from '../../utils/api-response.js';
import { listActiveCategories } from './categories.service.js';

export const listCategoriesController = asyncHandler(async (_req, res) => {
  const categories = await listActiveCategories();
  return sendSuccess(res, { categories }, 200);
});
