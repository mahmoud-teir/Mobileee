import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import Repair from '@/models/Repair';
import Screen from '@/models/Screen';

export async function GET(request) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const repairs = await Repair.find().sort({ date: -1 });
    return NextResponse.json(repairs);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const repairData = await request.json();
    if (repairData.useScreen && repairData.screenId) {
      await Screen.findByIdAndUpdate(repairData.screenId, { $inc: { quantity: -1 } });
    }
    const repair = new Repair(repairData);
    const newRepair = await repair.save();
    return NextResponse.json(newRepair, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message, errors: error.errors }, { status: 400 });
  }
}
