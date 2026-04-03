import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import Repair from '@/models/Repair';

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const repairs = await Repair.find({ status: params.status }).sort({ date: -1 });
    return NextResponse.json(repairs);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
