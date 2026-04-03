import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import Accessory from '@/models/Accessory';

export async function PATCH(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const { quantity } = await request.json();
    const item = await Accessory.findByIdAndUpdate(params.id, { $inc: { quantity } }, { new: true });
    if (!item) return NextResponse.json({ message: 'Accessory not found' }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
