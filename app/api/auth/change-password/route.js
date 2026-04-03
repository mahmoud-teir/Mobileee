import { NextResponse } from 'next/server';
import { getAuthUser } from '../../../../lib/auth';
import User from '../../../../models/User';
import { connectDB } from '../../../../lib/mongodb';

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    await connectDB();
    const { currentPassword, newPassword } = await request.json();

    const fullUser = await User.findById(user._id);
    const isMatch = await fullUser.comparePassword(currentPassword);

    if (!isMatch) {
      return NextResponse.json({ message: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 });
    }

    fullUser.password = newPassword;
    await fullUser.save();

    return NextResponse.json({ message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
