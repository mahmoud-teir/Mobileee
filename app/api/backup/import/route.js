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

export async function POST(request) {
  const user = await getAuthUser(request);
  const err = requireRole(user, 'admin');
  if (err) return err;
  try {
    await connectDB();
    const { data, clearExisting } = await request.json();

    if (clearExisting) {
      // CRITICAL: Only clear data for current store
      const storeFilter = { storeId: user.currentStoreId };
      await Promise.all([
        Screen.deleteMany(storeFilter), Phone.deleteMany(storeFilter), Accessory.deleteMany(storeFilter),
        Sticker.deleteMany(storeFilter), Customer.deleteMany(storeFilter), Supplier.deleteMany(storeFilter),
        Sale.deleteMany(storeFilter), Repair.deleteMany(storeFilter), Expense.deleteMany(storeFilter),
        Return.deleteMany(storeFilter), Installment.deleteMany(storeFilter)
      ]);
    }

    const results = {};
    const insert = async (Model, key) => {
      if (data[key]?.length > 0) {
        // CRITICAL: Inject storeId into every imported item
        const itemsWithStore = data[key].map(item => ({
          ...item,
          storeId: user.currentStoreId
        }));
        results[key] = await Model.insertMany(itemsWithStore, { ordered: false }).catch(e => ({ error: e.message }));
      }
    };

    await Promise.all([
      insert(Screen, 'screens'), insert(Phone, 'phones'), insert(Accessory, 'accessories'),
      insert(Sticker, 'stickers'), insert(Customer, 'customers'), insert(Supplier, 'suppliers'),
      insert(Sale, 'sales'), insert(Repair, 'repairs'), insert(Expense, 'expenses'),
      insert(Return, 'returns'), insert(Installment, 'installments')
    ]);

    return NextResponse.json({ message: 'تم استيراد البيانات بنجاح', results });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
