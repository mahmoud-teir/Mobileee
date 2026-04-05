export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import Phone from '@/models/Phone';

export async function GET(request) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;

  try {
    await connectDB();
    const phones = await Phone.find({ storeId: user.currentStoreId }).sort({ createdAt: -1 });
    return NextResponse.json(phones);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;

  try {
    await connectDB();
    const body = await request.json();

    // CRITICAL: Always use authenticated user's current store, never trust client
    body.storeId = user.currentStoreId;

    const phone = new Phone(body);
    const newPhone = await phone.save();
    return NextResponse.json(newPhone, { status: 201 });
  } catch (error) {
    // Provide clearer error messages for duplicate key violations
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {}).filter(k => k !== 'storeId').join(' و ');
      return NextResponse.json({
        message: `هذا العنصر موجود بالفعل في متجرك (${field}: ${Object.values(error.keyValue || {}).filter((_, i) => i > 0).join('، ')})`
      }, { status: 400 });
    }
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
