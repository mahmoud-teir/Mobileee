import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/mongodb';
import { getAuthUser, requireAuth } from '../../../../../lib/auth';
import Screen from '../../../../../models/Screen';

export async function PATCH(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;

  try {
    await connectDB();
    const { quantity } = await request.json();
    const screen = await Screen.findByIdAndUpdate(
      params.id,
      { $inc: { quantity } },
      { new: true }
    );
    if (!screen) return NextResponse.json({ message: 'Screen not found' }, { status: 404 });
    return NextResponse.json(screen);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
