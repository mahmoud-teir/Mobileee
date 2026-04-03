import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { signToken } from '@/lib/auth';
import User from '@/models/User';

export async function POST() {
  try {
    await connectDB();
    const adminExists = await User.findOne({ role: 'admin' });

    if (adminExists) {
      return NextResponse.json({ message: 'المسؤول موجود بالفعل' }, { status: 400 });
    }

    const admin = new User({
      username: 'admin',
      email: 'admin@mobileshop.com',
      password: 'admin123',
      name: 'مدير النظام',
      role: 'admin'
    });

    await admin.save();

    return NextResponse.json({
      message: 'تم إنشاء حساب المسؤول بنجاح',
      credentials: { username: 'admin', password: 'admin123' }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
