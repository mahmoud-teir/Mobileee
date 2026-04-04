export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireRole } from '@/lib/auth';
import User from '@/models/User';

export async function GET(request) {
  const user = await getAuthUser(request);
  const err = requireRole(user, 'admin', 'owner'); // Allowed owner too
  if (err) return err;
  try {
    await connectDB();
    const users = await User.find({ storeId: user.currentStoreId }).select('-password').sort({ createdAt: -1 });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await getAuthUser(request);
  const err = requireRole(user, 'admin', 'owner');
  if (err) return err;
  try {
    await connectDB();
    const { username, email, password, name, role } = await request.json();

    // Check plan limits
    const { PLAN_LIMITS } = await import('@/lib/planLimits');
    const plan = user.currentStore?.subscription?.plan || 'free';
    const limits = PLAN_LIMITS[plan];
    
    const currentUsersCount = await User.countDocuments({ storeId: user.currentStoreId });
    if (currentUsersCount >= limits.maxUsers) {
      return NextResponse.json({ 
        message: `لقد وصلت للحد الأقصى للمستخدمين في باقتك الحالية (${limits.maxUsers}). يرجى الترقية لإضافة المزيد.` 
      }, { status: 403 });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return NextResponse.json({
        message: existingUser.email === email ? 'البريد الإلكتروني مستخدم بالفعل' : 'اسم المستخدم مستخدم بالفعل'
      }, { status: 400 });
    }

    const newUser = new User({ 
      username, 
      email, 
      password, 
      name: name || username, 
      role: role || 'employee',
      storeId: user.currentStoreId
    });
    await newUser.save();
    return NextResponse.json({ message: 'تم إنشاء المستخدم بنجاح', user: newUser.toJSON() }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
