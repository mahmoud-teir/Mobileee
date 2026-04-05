import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import Programming from '@/models/Programming';

export async function PATCH(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;

  try {
    await connectDB();
    const { status } = await request.json();
    const programmingItem = await Programming.findOneAndUpdate(
      { _id: params.id, storeId: user.currentStoreId },
      { status },
      { new: true }
    );
    if (!programmingItem) return NextResponse.json({ message: 'Programming item not found' }, { status: 404 });
    return NextResponse.json(programmingItem);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
