import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/mongodb';
import { getAuthUser, requireAuth } from '../../../../../lib/auth';
import User from '../../../../../models/User';
import Screen from '../../../../../models/Screen';
import Phone from '../../../../../models/Phone';
import Accessory from '../../../../../models/Accessory';
import Sticker from '../../../../../models/Sticker';
import Customer from '../../../../../models/Customer';
import Supplier from '../../../../../models/Supplier';
import Sale from '../../../../../models/Sale';
import Repair from '../../../../../models/Repair';
import Expense from '../../../../../models/Expense';
import Return from '../../../../../models/Return';
import Installment from '../../../../../models/Installment';

const models = {
  users: User, screens: Screen, phones: Phone, accessories: Accessory,
  stickers: Sticker, customers: Customer, suppliers: Supplier, sales: Sale,
  repairs: Repair, expenses: Expense, returns: Return, installments: Installment
};

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    const Model = models[params.name];
    if (!Model) return NextResponse.json({ message: 'Collection not found' }, { status: 404 });

    const total = await Model.countDocuments();
    let query = Model.find();
    if (params.name === 'users') query = query.select('-password');

    const data = await query.sort({ createdAt: -1 }).skip(skip).limit(limit);
    return NextResponse.json({ collection: params.name, total, limit, skip, data });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
