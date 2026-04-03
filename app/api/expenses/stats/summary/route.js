import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import { getAuthUser, requireAuth } from '../../../../lib/auth';
import Expense from '../../../../models/Expense';

export async function GET(request) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const monthExpenses = await Expense.find({ date: { $gte: startOfMonth, $lte: endOfMonth } });
    const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory = monthExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});
    return NextResponse.json({ totalExpenses, count: monthExpenses.length, byCategory });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
