import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Category } from '../models/Category.model.js';
import { User } from '../models/User.model.js';
import { Listing } from '../models/Listing.model.js';
import { Resource } from '../models/Resource.model.js';
import { logger } from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEEDS_DIR = path.resolve(__dirname, '../../database-seeds');

function parseMongoEjson(obj) {
  if (Array.isArray(obj)) {
    return obj.map(parseMongoEjson);
  }
  if (obj !== null && typeof obj === 'object') {
    if ('$oid' in obj && Object.keys(obj).length === 1) {
      return new mongoose.Types.ObjectId(obj.$oid);
    }
    if ('$date' in obj && Object.keys(obj).length === 1) {
      return new Date(obj.$date);
    }
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = parseMongoEjson(value);
    }
    return result;
  }
  return obj;
}

function loadSeedFile(filename) {
  const filePath = path.join(SEEDS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Seed file not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  return parseMongoEjson(parsed);
}

export async function importSeeds() {
  console.log('Connecting to database using MONGODB_URI...');
  await connectDatabase();
  console.log('Connected to MongoDB successfully.');

  // 1. Categories
  const categories = loadSeedFile('categories.json');
  console.log(`Importing ${categories.length} categories...`);
  for (const cat of categories) {
    await Category.findOneAndUpdate(
      { _id: cat._id },
      { $set: cat },
      { upsert: true, returnDocument: 'after' }
    );
  }
  console.log('✓ Categories imported.');

  // 2. Users
  const users = loadSeedFile('users.json');
  console.log(`Importing ${users.length} users...`);
  for (const user of users) {
    await User.findOneAndUpdate(
      { _id: user._id },
      { $set: user },
      { upsert: true, returnDocument: 'after' }
    );
  }
  console.log('✓ Users imported.');

  // 3. Listings
  const listings = loadSeedFile('listings.json');
  console.log(`Importing ${listings.length} listings...`);
  for (const item of listings) {
    await Listing.findOneAndUpdate(
      { _id: item._id },
      { $set: item },
      { upsert: true, returnDocument: 'after' }
    );
  }
  console.log('✓ Listings imported.');

  // 4. Resources
  const resources = loadSeedFile('resources.json');
  console.log(`Importing ${resources.length} study resources...`);
  for (const res of resources) {
    await Resource.findOneAndUpdate(
      { _id: res._id },
      { $set: res },
      { upsert: true, returnDocument: 'after' }
    );
  }
  console.log('✓ Resources imported.');

  console.log('\nAll seed collections have been successfully synced to MongoDB!');
  await disconnectDatabase();
}

if (process.argv[1] && process.argv[1].includes('import-seeds.js')) {
  importSeeds().catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
  });
}
