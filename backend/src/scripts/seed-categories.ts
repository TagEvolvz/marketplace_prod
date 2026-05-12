/**
 * seed-categories.ts
 * Seeds the three store sections + all subcategories into MongoDB Atlas.
 *
 * Usage:
 *   npm run seed:categories
 */

import dotenv from 'dotenv';
import dns from 'dns';
dotenv.config();

// Ensure SRV DNS lookups succeed even if local resolver is flaky
dns.setServers(['8.8.8.8', '1.1.1.1']);
import mongoose from 'mongoose';
import { Category } from '../models/index';

const STORE_STRUCTURE = [
  {
    name: 'Pharmacy', slug: 'pharmacy', storeSection: 'pharmacy' as const, icon: 'pill',
    description: 'Medicines, health products, and pharmacy items',
    subcategories: [
      { name: 'Pain Relief',          slug: 'pain-relief',         icon: 'thermometer' },
      { name: 'Antibiotics',          slug: 'antibiotics',         icon: 'shield' },
      { name: 'Cold & Flu',           slug: 'cold-flu',            icon: 'wind' },
      { name: 'Vitamins & Supplements',slug: 'vitamins-supplements',icon: 'heart-pulse' },
      { name: 'First Aid',            slug: 'first-aid',           icon: 'cross' },
      { name: 'Digestive Health',     slug: 'digestive-health',    icon: 'activity' },
      { name: 'Sexual Health',        slug: 'sexual-health',       icon: 'heart' },
      { name: 'Prescription Drugs',   slug: 'prescription-drugs',  icon: 'file-text' },
    ],
  },
  {
    name: 'Supermarket', slug: 'supermarket', storeSection: 'supermarket' as const, icon: 'shopping-cart',
    description: 'Groceries, food, and household supplies',
    subcategories: [
      { name: 'Grains & Rice',       slug: 'grains-rice',        icon: 'wheat' },
      { name: 'Beverages',           slug: 'beverages',          icon: 'coffee' },
      { name: 'Snacks & Biscuits',   slug: 'snacks-biscuits',    icon: 'cookie' },
      { name: 'Canned Goods',        slug: 'canned-goods',       icon: 'package' },
      { name: 'Frozen Foods',        slug: 'frozen-foods',       icon: 'snowflake' },
      { name: 'Dairy',               slug: 'dairy',              icon: 'milk' },
      { name: 'Bakery',              slug: 'bakery',             icon: 'wheat' },
      { name: 'Spices & Seasoning',  slug: 'spices-seasoning',   icon: 'flame' },
      { name: 'Household Supplies',  slug: 'household-supplies', icon: 'home' },
    ],
  },
  {
    name: 'Cosmetics', slug: 'cosmetics', storeSection: 'cosmetics' as const, icon: 'sparkles',
    description: 'Beauty, skincare, and personal care products',
    subcategories: [
      { name: 'Skincare',         slug: 'skincare',        icon: 'sun' },
      { name: 'Haircare',         slug: 'haircare',        icon: 'scissors' },
      { name: 'Makeup',           slug: 'makeup',          icon: 'palette' },
      { name: 'Fragrances',       slug: 'fragrances',      icon: 'wind' },
      { name: 'Personal Hygiene', slug: 'personal-hygiene',icon: 'droplets' },
      { name: 'Baby Care',        slug: 'baby-care',       icon: 'baby' },
    ],
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log('Connected.\n');

  let created = 0;

  for (const section of STORE_STRUCTURE) {
    console.log(`Seeding: ${section.name}`);

    const parent = await Category.findOneAndUpdate(
      { slug: section.slug },
      {
        name: section.name, slug: section.slug,
        storeSection: section.storeSection, icon: section.icon,
        description: section.description, parent: null,
        isActive: true, sortOrder: STORE_STRUCTURE.indexOf(section),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    created++;

    const childIds: mongoose.Types.ObjectId[] = [];
    for (const [i, sub] of section.subcategories.entries()) {
      const child = await Category.findOneAndUpdate(
        { slug: sub.slug },
        {
          name: sub.name, slug: sub.slug,
          storeSection: section.storeSection, icon: sub.icon,
          parent: parent._id, isActive: true, sortOrder: i,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      childIds.push(child._id);
      console.log(`  + ${child.name}`);
      created++;
    }

    await Category.findByIdAndUpdate(parent._id, { children: childIds });
  }

  console.log(`\nDone — ${created} categories seeded.`);
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error('Seed failed:', e.message);
  process.exit(1);
});
