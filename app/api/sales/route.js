export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import Sale from '@/models/Sale';
import Screen from '@/models/Screen';
import Phone from '@/models/Phone';
import Accessory from '@/models/Accessory';
import Sticker from '@/models/Sticker';
import Customer from '@/models/Customer';
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

export async function GET(request) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;

  try {
    await connectDB();
    // Filter by storeId
    const sales = await Sale.find({ storeId: user.currentStoreId }).sort({ date: -1 });
    return NextResponse.json(sales);
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
    const saleData = await request.json();

    // Ensure storeId is set to the current store
    saleData.storeId = user.currentStoreId;

    for (const item of saleData.items) {
      const Model = getModelByType(item.type);
      if (Model && item.productId) {
        // SECURITY: Ensure item belongs to the same store
        await Model.findOneAndUpdate(
          { _id: item.productId, storeId: user.currentStoreId }, 
          { $inc: { quantity: -item.quantity } }
        );
      }
    }

    if (saleData.customerId) {
      await Customer.findOneAndUpdate(
        { _id: saleData.customerId, storeId: user.currentStoreId },
        {
          $inc: { totalPurchases: saleData.total },
          lastPurchase: new Date()
        }
      );
    }

    const sale = new Sale(saleData);
    const newSale = await sale.save();
    return NextResponse.json(newSale, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
