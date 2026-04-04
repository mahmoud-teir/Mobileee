import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import Sticker from '@/models/Sticker';

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const item = await Sticker.findOne({ _id: params.id, storeId: user.currentStoreId });
    if (!item) return NextResponse.json({ message: 'Sticker not found' }, { status: 404 });
    return NextResponse.json(item);
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
    const item = await Sticker.findOneAndUpdate(
      { _id: params.id, storeId: user.currentStoreId }, 
      await request.json(), 
      { new: true, runValidators: true }
    );
    if (!item) return NextResponse.json({ message: 'Sticker not found' }, { status: 404 });
    return NextResponse.json(item);
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
    const item = await Sticker.findOneAndDelete({ _id: params.id, storeId: user.currentStoreId });
    if (!item) return NextResponse.json({ message: 'Sticker not found' }, { status: 404 });
    return NextResponse.json({ message: 'Sticker deleted successfully' });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
