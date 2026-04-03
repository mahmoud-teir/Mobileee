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

export async function GET(request) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const returns = await Return.find().sort({ date: -1 });
    return NextResponse.json(returns);
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
    const returnData = await request.json();
    // Restore inventory for returned items
    for (const item of returnData.items) {
      const Model = getModelByType(item.type);
      if (Model && item.productId) {
        await Model.findByIdAndUpdate(item.productId, { $inc: { quantity: item.quantity } });
      }
    }
    const returnDoc = new Return(returnData);
    return NextResponse.json(await returnDoc.save(), { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
