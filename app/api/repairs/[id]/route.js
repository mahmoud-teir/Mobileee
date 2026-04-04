export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import Repair from '@/models/Repair';
import Screen from '@/models/Screen';

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const repair = await Repair.findById(params.id);
    if (!repair) return NextResponse.json({ message: 'Repair not found' }, { status: 404 });
    return NextResponse.json(repair);
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
    const repair = await Repair.findByIdAndUpdate(params.id, await request.json(), { new: true, runValidators: true });
    if (!repair) return NextResponse.json({ message: 'Repair not found' }, { status: 404 });
    return NextResponse.json(repair);
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
    const repair = await Repair.findById(params.id);
    if (!repair) return NextResponse.json({ message: 'Repair not found' }, { status: 404 });

    // Restore screen to inventory if it was used
    if (repair.useScreen && repair.screenId) {
      await Screen.findByIdAndUpdate(repair.screenId, { $inc: { quantity: 1 } });
    }

    await Repair.findByIdAndDelete(params.id);
    return NextResponse.json({ message: 'Repair deleted successfully' });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
