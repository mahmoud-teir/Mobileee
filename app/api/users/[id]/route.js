import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireRole } from '@/lib/auth';
import User from '@/models/User';

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireRole(user, 'admin');
  if (err) return err;
  try {
    await connectDB();
    const found = await User.findById(params.id).select('-password');
    if (!found) return NextResponse.json({ message: 'المستخدم غير موجود' }, { status: 404 });
    return NextResponse.json(found);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireRole(user, 'admin');
  if (err) return err;
  try {
    await connectDB();
    const { username, email, password, name, role } = await request.json();
    const userId = params.id;

    const existing = await User.findOne({ $or: [{ email }, { username }], _id: { $ne: userId } });
    if (existing) {
      return NextResponse.json({
        message: existing.email === email ? 'البريد الإلكتروني مستخدم بالفعل' : 'اسم المستخدم مستخدم بالفعل'
      }, { status: 400 });
    }

    const found = await User.findById(userId);
    if (!found) return NextResponse.json({ message: 'المستخدم غير موجود' }, { status: 404 });

    found.username = username || found.username;
    found.email = email || found.email;
    found.name = name || found.name;
    found.role = role || found.role;
    if (password) found.password = password;
    await found.save();

    return NextResponse.json({ message: 'تم تحديث المستخدم بنجاح', user: found.toJSON() });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireRole(user, 'admin');
  if (err) return err;
  try {
    await connectDB();
    const userId = params.id;
    if (userId === user._id.toString()) {
      return NextResponse.json({ message: 'لا يمكنك حذف حسابك الخاص' }, { status: 400 });
    }
    const found = await User.findByIdAndDelete(userId);
    if (!found) return NextResponse.json({ message: 'المستخدم غير موجود' }, { status: 404 });
    return NextResponse.json({ message: 'تم حذف المستخدم بنجاح' });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
