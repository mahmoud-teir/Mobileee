import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/mongodb';
import { getAuthUser, requireAuth } from '../../../../../lib/auth';
import Expense from '../../../../../models/Expense';

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const expenses = await Expense.find({ category: params.category }).sort({ date: -1 });
    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
