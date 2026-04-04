import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { signToken } from '@/lib/auth';
import User from '@/models/User';

export async function POST(request) {
  try {
    await connectDB();
    const { username, password } = await request.json();

    const user = await User.findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user) {
      return NextResponse.json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ message: 'الحساب معطل. يرجى التواصل مع المسؤول' }, { status: 401 });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user._id);

    // Get store slug if available
    let storeSlug = null;
    if (user.storeId) {
      const { Store } = await import('@/models/User');
      const store = await Store.findById(user.storeId);
      if (store) storeSlug = store.slug;
    }

    return NextResponse.json({
      message: 'تم تسجيل الدخول بنجاح',
      user: { ...user.toJSON(), storeSlug },
      token,
      storeSlug // Explicit for convenience
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
