import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import Screen from '@/models/Screen';

export async function GET(request) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;

  try {
    await connectDB();
    const screens = await Screen.find({ $expr: { $lte: ['$quantity', '$minQuantity'] } });
    return NextResponse.json(screens);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
