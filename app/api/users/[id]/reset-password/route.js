import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireRole } from '@/lib/auth';
import User from '@/models/User';

export async function PATCH(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireRole(user, 'admin', 'owner');
  if (err) return err;
  try {
    await connectDB();
    const { newPassword } = await request.json();
    const found = await User.findOne({ _id: params.id, storeId: user.currentStoreId });
    if (!found) return NextResponse.json({ message: 'المستخدم غير موجود' }, { status: 404 });
    found.password = newPassword;
    await found.save();
    return NextResponse.json({ message: 'تم إعادة تعيين كلمة المرور بنجاح' });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
