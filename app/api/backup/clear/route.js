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
    await Promise.all([
      Screen.deleteMany({}), Phone.deleteMany({}), Accessory.deleteMany({}),
      Sticker.deleteMany({}), Customer.deleteMany({}), Supplier.deleteMany({}),
      Sale.deleteMany({}), Repair.deleteMany({}), Expense.deleteMany({}),
      Return.deleteMany({}), Installment.deleteMany({})
    ]);
    return NextResponse.json({ message: 'All data cleared successfully' });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
