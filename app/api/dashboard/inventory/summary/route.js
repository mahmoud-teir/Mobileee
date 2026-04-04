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
      Screen.find({ storeId: user.currentStoreId }), 
      Phone.find({ storeId: user.currentStoreId }), 
      Accessory.find({ storeId: user.currentStoreId }), 
      Sticker.find({ storeId: user.currentStoreId })
    ]);
    const calcValue = (items) => items.reduce((sum, i) => sum + (i.cost * i.quantity), 0);
    const calcCount = (items) => items.reduce((sum, i) => sum + i.quantity, 0);
    return NextResponse.json({
      screens: { types: screens.length, quantity: calcCount(screens), value: calcValue(screens) },
      phones: { types: phones.length, quantity: calcCount(phones), value: calcValue(phones) },
      accessories: { types: accessories.length, quantity: calcCount(accessories), value: calcValue(accessories) },
      stickers: { types: stickers.length, quantity: calcCount(stickers), value: calcValue(stickers) },
      totalValue: calcValue(screens) + calcValue(phones) + calcValue(accessories) + calcValue(stickers)
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
