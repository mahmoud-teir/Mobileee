import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import Sale from '@/models/Sale';
import Screen from '@/models/Screen';
import Phone from '@/models/Phone';
import Accessory from '@/models/Accessory';
import Sticker from '@/models/Sticker';
import Product from '@/models/Product';

const getModelByType = (type) => {
  switch (type) {
    case 'screen': return Screen;
    case 'phone': return Phone;
    case 'accessory': return Accessory;
    case 'sticker': return Sticker;
    case 'product': return Product;
    default: return null;
  }
};

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const sale = await Sale.findOne({ _id: params.id, storeId: user.currentStoreId });
    if (!sale) return NextResponse.json({ message: 'Sale not found' }, { status: 404 });
    return NextResponse.json(sale);
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
    const sale = await Sale.findOneAndUpdate(
      { _id: params.id, storeId: user.currentStoreId }, 
      await request.json(), 
      { new: true, runValidators: true }
    );
    if (!sale) return NextResponse.json({ message: 'Sale not found' }, { status: 404 });
    return NextResponse.json(sale);
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
    const sale = await Sale.findOne({ _id: params.id, storeId: user.currentStoreId });
    if (!sale) return NextResponse.json({ message: 'Sale not found' }, { status: 404 });

    // Restore inventory
    for (const item of sale.items) {
      const Model = getModelByType(item.type);
      if (Model && item.productId) {
        // Scoped to storeId for security
        await Model.findOneAndUpdate(
          { _id: item.productId, storeId: user.currentStoreId },
          { $inc: { quantity: item.quantity } }
        );
      }
    }

    await Sale.findOneAndDelete({ _id: params.id, storeId: user.currentStoreId });
    return NextResponse.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
