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

export async function GET(request) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;

  // Check plan feature
  const { hasFeature } = await import('@/lib/planLimits');
  if (!hasFeature(user.currentStore?.subscription?.plan || 'free', 'installments')) {
    return NextResponse.json({ message: 'هذه الميزة غير متوفرة في باقتك الحالية' }, { status: 403 });
  }

  try {
    await connectDB();
    const installments = await Installment.find({ storeId: user.currentStoreId }).sort({ createdAt: -1 });
    return NextResponse.json(installments);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;

  // Check plan feature
  const { hasFeature } = await import('@/lib/planLimits');
  if (!hasFeature(user.currentStore?.subscription?.plan || 'free', 'installments')) {
    return NextResponse.json({ message: 'هذه الميزة غير متوفرة في باقتك الحالية' }, { status: 403 });
  }

  try {
    await connectDB();
    const installmentData = await request.json();
    installmentData.storeId = user.currentStoreId;

    for (const item of installmentData.items) {
      const Model = getModelByType(item.type);
      if (Model && item.productId) {
        // Scoped to storeId for security
        await Model.findOneAndUpdate(
          { _id: item.productId, storeId: user.currentStoreId },
          { $inc: { quantity: -item.quantity } }
        );
      }
    }
    const installment = new Installment(installmentData);
    return NextResponse.json(await installment.save(), { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
