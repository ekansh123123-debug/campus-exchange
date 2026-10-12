import { Router } from 'express';
import { listCategoriesController } from './categories.controller.js';

const router = Router();

router.get('/', listCategoriesController);

export default router;
