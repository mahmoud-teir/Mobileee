import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireRole } from '@/lib/auth';
import Screen from '@/models/Screen';
import Phone from '@/models/Phone';
import Accessory from '@/models/Accessory';
import Sticker from '@/models/Sticker';
import Customer from '@/models/Customer';
import Supplier from '@/models/Supplier';
import Sale from '@/models/Sale';
import Repair from '@/models/Repair';
import Expense from '@/models/Expense';
import Return from '@/models/Return';
import Installment from '@/models/Installment';

export async function GET(request) {
  const user = await getAuthUser(request);
  const err = requireRole(user, 'admin');
  if (err) return err;
  try {
    await connectDB();

    // CRITICAL: Scope all exports to current store only
    const storeFilter = { storeId: user.currentStoreId };

    const [screens, phones, accessories, stickers, customers, suppliers,
      sales, repairs, expenses, returns, installments] = await Promise.all([
        Screen.find(storeFilter), Phone.find(storeFilter), Accessory.find(storeFilter), Sticker.find(storeFilter),
        Customer.find(storeFilter), Supplier.find(storeFilter), Sale.find(storeFilter), Repair.find(storeFilter),
        Expense.find(storeFilter), Return.find(storeFilter), Installment.find(storeFilter)
      ]);
    return NextResponse.json({
      version: '2.0.0',
      exportDate: new Date().toISOString(),
      storeSlug: user.currentStore?.slug,
      data: {
        screens, phones, accessories, stickers, customers, suppliers,
        sales, repairs, expenses, returns, installments
      }
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
