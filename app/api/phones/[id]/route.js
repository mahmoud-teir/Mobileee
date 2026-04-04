export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import Phone from '@/models/Phone';

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;

  try {
    await connectDB();
    const phone = await Phone.findById(params.id);
    if (!phone) return NextResponse.json({ message: 'Phone not found' }, { status: 404 });
    return NextResponse.json(phone);
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
    const phone = await Phone.findByIdAndUpdate(params.id, body, { new: true, runValidators: true });
    if (!phone) return NextResponse.json({ message: 'Phone not found' }, { status: 404 });
    return NextResponse.json(phone);
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
    const phone = await Phone.findByIdAndDelete(params.id);
    if (!phone) return NextResponse.json({ message: 'Phone not found' }, { status: 404 });
    return NextResponse.json({ message: 'Phone deleted successfully' });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
