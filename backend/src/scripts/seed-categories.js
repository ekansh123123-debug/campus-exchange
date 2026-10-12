import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { ensureCategoriesSeeded, listActiveCategories } from '../modules/categories/categories.service.js';

async function run() {
  await connectDatabase();
  await ensureCategoriesSeeded();
  const categories = await listActiveCategories();
  console.log(`Seeded ${categories.length} controlled academic categories.`);
  await disconnectDatabase();
}

const isDirect =
  process.argv[1] && process.argv[1].includes('seed-categories.js');

if (isDirect) {
  run().catch((err) => {
    console.error('Failed to seed categories:', err.message);
    process.exit(1);
  });
}
