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

export async function DELETE(request) {
  const user = await getAuthUser(request);
  const err = requireRole(user, 'admin');
  if (err) return err;
  try {
    await connectDB();

    // CRITICAL: Scope all deletions to current store only
    const storeFilter = { storeId: user.currentStoreId };

    await Promise.all([
      Screen.deleteMany(storeFilter), Phone.deleteMany(storeFilter), Accessory.deleteMany(storeFilter),
      Sticker.deleteMany(storeFilter), Customer.deleteMany(storeFilter), Supplier.deleteMany(storeFilter),
      Sale.deleteMany(storeFilter), Repair.deleteMany(storeFilter), Expense.deleteMany(storeFilter),
      Return.deleteMany(storeFilter), Installment.deleteMany(storeFilter)
    ]);
    return NextResponse.json({ message: 'تم مسح بيانات المتجر بنجاح' });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
