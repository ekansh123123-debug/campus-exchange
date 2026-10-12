import { Category } from '../../models/Category.model.js';
import { INITIAL_CATEGORIES } from '../../constants/academic.js';

export function toCategoryDto(catDoc) {
  const c = typeof catDoc.toObject === 'function' ? catDoc.toObject() : catDoc;
  return {
    id: String(c._id || c.id),
    name: c.name,
    slug: c.slug,
    description: c.description || '',
    sortOrder: c.sortOrder || 0,
  };
}

export async function ensureCategoriesSeeded() {
  const count = await Category.countDocuments();
  if (count === 0) {
    for (const cat of INITIAL_CATEGORIES) {
      await Category.findOneAndUpdate(
        { slug: cat.slug },
        { $setOnInsert: cat },
        { upsert: true, returnDocument: 'after' }
      );
    }
  }
}

export async function listActiveCategories() {
  await ensureCategoriesSeeded();
  const categories = await Category.find({ active: true }).sort({ sortOrder: 1, name: 1 });
  return categories.map(toCategoryDto);
}
