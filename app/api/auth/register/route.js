import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { signToken } from '@/lib/auth';
import User from '@/models/User';

export async function POST(request) {
  try {
    await connectDB();
    const { username, email, password, name, role, storeName, storeSlug, secretKey } = await request.json();
    const { Store } = await import('@/models/User');

    // Protect store creation with a secret key
    if (role === 'owner' && secretKey !== process.env.REGISTRATION_SECRET) {
      return NextResponse.json({ message: 'مفتاح التسجيل غير صحيح' }, { status: 403 });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return NextResponse.json({
        message: existingUser.email === email ? 'البريد الإلكتروني مستخدم بالفعل' : 'اسم المستخدم مستخدم بالفعل'
      }, { status: 400 });
    }

    let createdStoreId = null;
    if (role === 'owner') {
      if (!storeName || !storeSlug) {
        return NextResponse.json({ message: 'اسم المتجر والسيج مطلوبان للمالك' }, { status: 400 });
      }
      const existingStore = await Store.findOne({ slug: storeSlug });
      if (existingStore) {
        return NextResponse.json({ message: 'رابط المتجر (slug) مستخدم بالفعل' }, { status: 400 });
      }

      const newStore = new Store({
        name: storeName,
        slug: storeSlug,
        ownerId: new mongoose.Types.ObjectId() // Temporary placeholder
      });
      
      const user = new User({
        username,
        email,
        password,
        name: name || username,
        role: 'owner',
        storeId: newStore._id
      });

      newStore.ownerId = user._id;
      await Promise.all([user.save(), newStore.save()]);
      
      const token = signToken(user._id);
      return NextResponse.json({
        message: 'تم إنشاء المتجر والحساب بنجاح',
        user: user.toJSON(),
        store: newStore,
        token
      }, { status: 201 });
    }

    // Default employee registration (needs storeId from request or invitation in real app)
    // For now, allow regular registration if no store info is provided
    const user = new User({
      username,
      email,
      password,
      name: name || username,
      role: role || 'employee'
    });

    await user.save();
    const token = signToken(user._id);

    return NextResponse.json({
      message: 'تم إنشاء الحساب بنجاح',
      user: user.toJSON(),
      token
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
