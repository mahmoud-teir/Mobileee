import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import Repair from '@/models/Repair';

export async function PATCH(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const { status } = await request.json();
    const repair = await Repair.findOneAndUpdate(
      { _id: params.id, storeId: user.currentStoreId }, 
      { status }, 
      { new: true }
    );
    if (!repair) return NextResponse.json({ message: 'Repair not found' }, { status: 404 });
    return NextResponse.json(repair);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
