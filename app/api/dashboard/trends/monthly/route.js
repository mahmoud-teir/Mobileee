import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import Sale from '@/models/Sale';
import Repair from '@/models/Repair';
import Expense from '@/models/Expense';

export async function GET(request) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const today = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const start = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const end = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);

      const [sales, repairs, expenses] = await Promise.all([
        Sale.find({ date: { $gte: start, $lte: end } }),
        Repair.find({ date: { $gte: start, $lte: end } }),
        Expense.find({ date: { $gte: start, $lte: end } })
      ]);

      const salesRevenue = sales.reduce((sum, s) => sum + s.total, 0);
      const repairRevenue = repairs.reduce((sum, r) => sum + r.cost, 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const profit = sales.reduce((sum, s) => sum + s.profit, 0) +
                     repairs.reduce((sum, r) => sum + r.profit, 0) -
                     totalExpenses;

      months.push({
        month: start.toLocaleString('ar-SA', { month: 'long' }),
        year: start.getFullYear(),
        salesRevenue, repairRevenue, expenses: totalExpenses, profit,
        salesCount: sales.length, repairsCount: repairs.length
      });
    }

    return NextResponse.json(months);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
