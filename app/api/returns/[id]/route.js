import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import Return from '@/models/Return';
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
    const returnDoc = await Return.findById(params.id);
    if (!returnDoc) return NextResponse.json({ message: 'Return not found' }, { status: 404 });
    return NextResponse.json(returnDoc);
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
    const returnDoc = await Return.findByIdAndUpdate(params.id, await request.json(), { new: true, runValidators: true });
    if (!returnDoc) return NextResponse.json({ message: 'Return not found' }, { status: 404 });
    return NextResponse.json(returnDoc);
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
    const returnDoc = await Return.findById(params.id);
    if (!returnDoc) return NextResponse.json({ message: 'Return not found' }, { status: 404 });
    // Re-deduct inventory (undo the return)
    for (const item of returnDoc.items) {
      const Model = getModelByType(item.type);
      if (Model && item.productId) {
        await Model.findByIdAndUpdate(item.productId, { $inc: { quantity: -item.quantity } });
      }
    }
    await Return.findByIdAndDelete(params.id);
    return NextResponse.json({ message: 'Return deleted successfully' });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
