const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb+srv://mahmoudteirbusiness_db_user:M%21a%40h%23m1o2u3d4@cluster0.dr0h4wj.mongodb.net/mobile_shop?retryWrites=true&w=majority';

async function promote(username) {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');
    
    const User = mongoose.connection.collection('users');
    
    const user = await User.findOne({ username });
    if (!user) {
      console.error(`User [${username}] not found.`);
      process.exit(1);
    }
    
    const result = await User.updateOne(
      { _id: user._id },
      { $set: { role: 'super_admin' } }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`Success: User [${username}] promoted to super_admin.`);
    } else {
      console.log(`User [${username}] is already a super_admin or no changes made.`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Promotion Error:', err);
    process.exit(1);
  }
}

const targetUsername = process.argv[2];
if (!targetUsername) {
  console.log('Usage: node scripts/promote_admin.js <username>');
  process.exit(1);
}

promote(targetUsername);
