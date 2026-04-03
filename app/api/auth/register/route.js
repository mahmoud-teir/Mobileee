import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { signToken } from '@/lib/auth';
import User from '@/models/User';

export async function POST(request) {
  try {
    await connectDB();
    const { username, email, password, name, role } = await request.json();

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });

    if (existingUser) {
      return NextResponse.json({
        message: existingUser.email === email
          ? 'البريد الإلكتروني مستخدم بالفعل'
          : 'اسم المستخدم مستخدم بالفعل'
      }, { status: 400 });
    }

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
