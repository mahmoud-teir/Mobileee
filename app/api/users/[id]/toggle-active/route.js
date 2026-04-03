import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireRole } from '@/lib/auth';
import User from '@/models/User';

export async function PATCH(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireRole(user, 'admin');
  if (err) return err;
  try {
    await connectDB();
    const { isActive } = await request.json();
    const userId = params.id;

    if (userId === user._id.toString()) {
      return NextResponse.json({ message: 'لا يمكنك تعطيل حسابك الخاص' }, { status: 400 });
    }

    const found = await User.findByIdAndUpdate(userId, { isActive }, { new: true }).select('-password');
    if (!found) return NextResponse.json({ message: 'المستخدم غير موجود' }, { status: 404 });

    return NextResponse.json({
      message: isActive ? 'تم تفعيل المستخدم' : 'تم تعطيل المستخدم',
      user: found
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
