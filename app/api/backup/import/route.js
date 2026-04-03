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

export async function POST(request) {
  const user = await getAuthUser(request);
  const err = requireRole(user, 'admin');
  if (err) return err;
  try {
    await connectDB();
    const { data, clearExisting } = await request.json();

    if (clearExisting) {
      await Promise.all([
        Screen.deleteMany({}), Phone.deleteMany({}), Accessory.deleteMany({}),
        Sticker.deleteMany({}), Customer.deleteMany({}), Supplier.deleteMany({}),
        Sale.deleteMany({}), Repair.deleteMany({}), Expense.deleteMany({}),
        Return.deleteMany({}), Installment.deleteMany({})
      ]);
    }

    const results = {};
    const insert = async (Model, key) => {
      if (data[key]?.length > 0) {
        results[key] = await Model.insertMany(data[key], { ordered: false }).catch(e => ({ error: e.message }));
      }
    };

    await Promise.all([
      insert(Screen, 'screens'), insert(Phone, 'phones'), insert(Accessory, 'accessories'),
      insert(Sticker, 'stickers'), insert(Customer, 'customers'), insert(Supplier, 'suppliers'),
      insert(Sale, 'sales'), insert(Repair, 'repairs'), insert(Expense, 'expenses'),
      insert(Return, 'returns'), insert(Installment, 'installments')
    ]);

    return NextResponse.json({ message: 'Data imported successfully', results });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
