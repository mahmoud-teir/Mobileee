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
    body.storeId = user.currentStoreId; // Inject storeId
    const phone = new Phone(body);
    const newPhone = await phone.save();
    return NextResponse.json(newPhone, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
