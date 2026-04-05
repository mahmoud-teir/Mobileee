/**
 * Migration Script: Fix storeId for all documents
 * 
 * This script ensures all documents in each collection have the correct storeId.
 * It assigns orphan documents (missing/wrong storeId) to the correct store.
 * 
 * Usage:
 *   node scripts/migrate-storeId.js
 * 
 * Requirements:
 *   - MONGODB_URI in .env.local
 *   - Run with: `npx dotenv -e .env.local -- node scripts/migrate-storeId.js`
 *     OR set MONGODB_URI manually before running
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Manually load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0 && !key.trim().startsWith('#')) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not defined in .env.local');
  process.exit(1);
}

// Import all models
const Phone = require('../models/Phone');
const Screen = require('../models/Screen');
const Accessory = require('../models/Accessory');
const Sticker = require('../models/Sticker');
const Product = require('../models/Product');
const Programming = require('../models/Programming');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Sale = require('../models/Sale');
const Repair = require('../models/Repair');
const Expense = require('../models/Expense');
const Return = require('../models/Return');
const Installment = require('../models/Installment');
const Category = require('../models/Category');
const { Store, default: User } = require('../models/User');

const COLLECTIONS = [
  { Model: Phone, name: 'phones', queryField: 'model' },
  { Model: Screen, name: 'screens', queryField: 'model' },
  { Model: Accessory, name: 'accessories', queryField: 'name' },
  { Model: Sticker, name: 'stickers', queryField: 'name' },
  { Model: Product, name: 'products', queryField: 'name' },
  { Model: Programming, name: 'programming', queryField: 'model' },
  { Model: Customer, name: 'customers', queryField: 'name' },
  { Model: Supplier, name: 'suppliers', queryField: 'name' },
  { Model: Sale, name: 'sales', queryField: 'customerName' },
  { Model: Repair, name: 'repairs', queryField: 'customerName' },
  { Model: Expense, name: 'expenses', queryField: 'description' },
  { Model: Return, name: 'returns', queryField: 'reason' },
  { Model: Installment, name: 'installments', queryField: 'customerName' },
  { Model: Category, name: 'categories', queryField: 'name' },
];

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const stores = await Store.find({ isActive: true });
    console.log(`📦 Found ${stores.length} active stores:`);
    stores.forEach(s => console.log(`   - ${s.name} (${s.slug}) [${s._id}]`));

    if (stores.length === 0) {
      console.log('⚠️ No active stores found. Skipping migration.');
      await mongoose.disconnect();
      return;
    }

    // If there's only one store, assign all orphan docs to it
    if (stores.length === 1) {
      const defaultStoreId = stores[0]._id;
      console.log(`\n🔄 Only 1 store found. Assigning all orphan documents to: ${stores[0].name}`);

      for (const { Model, name } of COLLECTIONS) {
        const result = await Model.updateMany(
          { $or: [{ storeId: null }, { storeId: { $exists: false } }, { storeId: { $nin: stores.map(s => s._id) } }] },
          { $set: { storeId: defaultStoreId } }
        );
        if (result.modifiedCount > 0) {
          console.log(`   ✅ ${name}: ${result.modifiedCount} documents fixed`);
        }
      }
    } else {
      // Multiple stores: try to match by user/store relationships
      console.log('\n⚠️ Multiple stores found. Manual review recommended for orphan documents.');

      // Show summary per store
      for (const store of stores) {
        console.log(`\n📊 Store: ${store.name} (${store.slug})`);
        for (const { Model, name } of COLLECTIONS) {
          const count = await Model.countDocuments({ storeId: store._id });
          console.log(`   - ${name}: ${count} documents`);
        }
      }

      // Show orphan documents
      console.log('\n🔍 Orphan documents (storeId not matching any active store):');
      for (const { Model, name } of COLLECTIONS) {
        const orphans = await Model.find({
          $or: [
            { storeId: null },
            { storeId: { $exists: false } },
            { storeId: { $nin: stores.map(s => s._id) } }
          ]
        }).limit(5).lean();

        if (orphans.length > 0) {
          console.log(`   ⚠️ ${name}: ${orphans.length} orphans (showing first 5):`);
          orphans.forEach(doc => {
            const label = doc.model || doc.name || doc.customerName || doc.description || doc._id.toString();
            console.log(`      - ${label} (storeId: ${doc.storeId})`);
          });
        }
      }
    }

    console.log('\n✅ Migration complete!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

migrate();
