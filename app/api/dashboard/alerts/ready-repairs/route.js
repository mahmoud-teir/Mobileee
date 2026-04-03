import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import Repair from '@/models/Repair';

export async function GET(request) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const repairs = await Repair.find({ status: 'جاهز', notified: false });
    return NextResponse.json(repairs);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
