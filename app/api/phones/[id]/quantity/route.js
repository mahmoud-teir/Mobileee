import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/mongodb';
import { getAuthUser, requireAuth } from '../../../../../lib/auth';
import Phone from '../../../../../models/Phone';

export async function PATCH(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;

  try {
    await connectDB();
    const { quantity } = await request.json();
    const phone = await Phone.findByIdAndUpdate(params.id, { $inc: { quantity } }, { new: true });
    if (!phone) return NextResponse.json({ message: 'Phone not found' }, { status: 404 });
    return NextResponse.json(phone);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
