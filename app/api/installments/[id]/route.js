export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import Installment from '@/models/Installment';
import Screen from '@/models/Screen';
import Phone from '@/models/Phone';
import Accessory from '@/models/Accessory';
import Sticker from '@/models/Sticker';

const getModelByType = (type) => {
  switch (type) {
    case 'screen': return Screen;
    case 'phone': return Phone;
    case 'accessory': return Accessory;
    case 'sticker': return Sticker;
    default: return null;
  }
};

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const inst = await Installment.findById(params.id);
    if (!inst) return NextResponse.json({ message: 'Installment not found' }, { status: 404 });
    return NextResponse.json(inst);
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
    const inst = await Installment.findByIdAndUpdate(params.id, await request.json(), { new: true, runValidators: true });
    if (!inst) return NextResponse.json({ message: 'Installment not found' }, { status: 404 });
    return NextResponse.json(inst);
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
    const inst = await Installment.findById(params.id);
    if (!inst) return NextResponse.json({ message: 'Installment not found' }, { status: 404 });
    // Restore inventory
    for (const item of inst.items) {
      const Model = getModelByType(item.type);
      if (Model && item.productId) {
        await Model.findByIdAndUpdate(item.productId, { $inc: { quantity: item.quantity } });
      }
    }
    await Installment.findByIdAndDelete(params.id);
    return NextResponse.json({ message: 'Installment deleted successfully' });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
