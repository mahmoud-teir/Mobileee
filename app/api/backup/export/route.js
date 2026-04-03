import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import { getAuthUser, requireRole } from '../../../../lib/auth';
import Screen from '../../../../models/Screen';
import Phone from '../../../../models/Phone';
import Accessory from '../../../../models/Accessory';
import Sticker from '../../../../models/Sticker';
import Customer from '../../../../models/Customer';
import Supplier from '../../../../models/Supplier';
import Sale from '../../../../models/Sale';
import Repair from '../../../../models/Repair';
import Expense from '../../../../models/Expense';
import Return from '../../../../models/Return';
import Installment from '../../../../models/Installment';

export async function GET(request) {
  const user = await getAuthUser(request);
  const err = requireRole(user, 'admin');
  if (err) return err;
  try {
    await connectDB();
    const [screens, phones, accessories, stickers, customers, suppliers,
           sales, repairs, expenses, returns, installments] = await Promise.all([
      Screen.find(), Phone.find(), Accessory.find(), Sticker.find(),
      Customer.find(), Supplier.find(), Sale.find(), Repair.find(),
      Expense.find(), Return.find(), Installment.find()
    ]);
    return NextResponse.json({
      version: '2.0.0',
      exportDate: new Date().toISOString(),
      data: { screens, phones, accessories, stickers, customers, suppliers,
              sales, repairs, expenses, returns, installments }
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
