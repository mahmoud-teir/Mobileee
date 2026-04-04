const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb+srv://mahmoudteirbusiness_db_user:M%21a%40h%23m1o2u3d4@cluster0.dr0h4wj.mongodb.net/mobile_shop?retryWrites=true&w=majority';

async function reset() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');
    
    const collections = [
      'stores', 
      'users', 
      'sales', 
      'repairs', 
      'expenses', 
      'customers', 
      'suppliers', 
      'installments', 
      'returns', 
      'screens', 
      'phones', 
      'accessories', 
      'stickers', 
      'categories', 
      'products',
      'tasks', // Adding others just in case
      'notifications'
    ];
    
    for (const colName of collections) {
      try {
        let filter = {};
        if (colName === 'users') {
          // Keep ONLY the super_admin
          filter = { role: { $ne: 'super_admin' } };
        }
        
        const coll = mongoose.connection.collection(colName);
        const result = await coll.deleteMany(filter);
        console.log(`Deleted ${result.deletedCount || 0} items from [${colName}]`);
      } catch (e) {
        // Skip if collection doesn't exist
      }
    }
    
    console.log('\n--- SYSTEM RESET COMPLETE ---');
    console.log('Only the super_admin user remains.');
    process.exit(0);
  } catch (err) {
    console.error('Reset Error:', err);
    process.exit(1);
  }
}

reset();
