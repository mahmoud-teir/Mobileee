export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import Programming from '@/models/Programming';

export async function GET(request) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;

  try {
    await connectDB();
    const programmingItems = await Programming.find({ storeId: user.currentStoreId }).sort({ createdAt: -1 });
    return NextResponse.json(programmingItems);
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
    body.storeId = user.currentStoreId;
    const programmingItem = new Programming(body);
    const newProgrammingItem = await programmingItem.save();
    return NextResponse.json(newProgrammingItem, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
