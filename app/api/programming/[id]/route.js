export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import Programming from '@/models/Programming';

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;

  try {
    await connectDB();
    const programmingItem = await Programming.findOne({ _id: params.id, storeId: user.currentStoreId });
    if (!programmingItem) return NextResponse.json({ message: 'Programming item not found' }, { status: 404 });
    return NextResponse.json(programmingItem);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;

  try {
    await connectDB();
    const body = await request.json();
    const programmingItem = await Programming.findOneAndUpdate(
      { _id: params.id, storeId: user.currentStoreId },
      body,
      { new: true, runValidators: true }
    );
    if (!programmingItem) return NextResponse.json({ message: 'Programming item not found' }, { status: 404 });
    return NextResponse.json(programmingItem);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;

  try {
    await connectDB();
    const programmingItem = await Programming.findOneAndDelete({ _id: params.id, storeId: user.currentStoreId });
    if (!programmingItem) return NextResponse.json({ message: 'Programming item not found' }, { status: 404 });
    return NextResponse.json({ message: 'Programming item deleted successfully' });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
