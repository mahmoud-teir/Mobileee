import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/mongodb';
import { getAuthUser, requireAuth } from '../../../lib/auth';
import Accessory from '../../../models/Accessory';

export async function GET(request) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const items = await Accessory.find().sort({ createdAt: -1 });
    return NextResponse.json(items);
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
    const item = new Accessory(await request.json());
    return NextResponse.json(await item.save(), { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
