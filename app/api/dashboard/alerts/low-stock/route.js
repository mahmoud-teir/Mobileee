import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import Screen from '@/models/Screen';
import Phone from '@/models/Phone';
import Accessory from '@/models/Accessory';
import Sticker from '@/models/Sticker';

export async function GET(request) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const [screens, phones, accessories, stickers] = await Promise.all([
      Screen.find({ storeId: user.currentStoreId, $expr: { $lte: ['$quantity', '$minQuantity'] } }),
      Phone.find({ storeId: user.currentStoreId, $expr: { $lte: ['$quantity', '$minQuantity'] } }),
      Accessory.find({ storeId: user.currentStoreId, $expr: { $lte: ['$quantity', '$minQuantity'] } }),
      Sticker.find({ storeId: user.currentStoreId, $expr: { $lte: ['$quantity', '$minQuantity'] } })
    ]);
    return NextResponse.json({
      screens, phones, accessories, stickers,
      total: screens.length + phones.length + accessories.length + stickers.length
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
