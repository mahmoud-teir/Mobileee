export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import Screen from '@/models/Screen';

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;

  try {
    await connectDB();
    const screen = await Screen.findOne({ _id: params.id, storeId: user.currentStoreId });
    if (!screen) return NextResponse.json({ message: 'Screen not found' }, { status: 404 });
    return NextResponse.json(screen);
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
    const screen = await Screen.findOneAndUpdate(
      { _id: params.id, storeId: user.currentStoreId }, 
      body, 
      { new: true, runValidators: true }
    );
    if (!screen) return NextResponse.json({ message: 'Screen not found' }, { status: 404 });
    return NextResponse.json(screen);
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
    const screen = await Screen.findOneAndDelete({ _id: params.id, storeId: user.currentStoreId });
    if (!screen) return NextResponse.json({ message: 'Screen not found' }, { status: 404 });
    return NextResponse.json({ message: 'Screen deleted successfully' });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
