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
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [sales, repairs, expenses] = await Promise.all([
      Sale.find({ date: { $gte: startOfMonth, $lte: endOfMonth } }),
      Repair.find({ date: { $gte: startOfMonth, $lte: endOfMonth } }),
      Expense.find({ date: { $gte: startOfMonth, $lte: endOfMonth } })
    ]);

    const salesRevenue = sales.reduce((sum, s) => sum + s.total, 0);
    const salesProfit = sales.reduce((sum, s) => sum + s.profit, 0);
    const repairRevenue = repairs.reduce((sum, r) => sum + r.cost, 0);
    const repairProfit = repairs.reduce((sum, r) => sum + r.profit, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = salesProfit + repairProfit - totalExpenses;

    return NextResponse.json({
      salesCount: sales.length, salesRevenue, salesProfit,
      repairsCount: repairs.length, repairRevenue, repairProfit,
      expensesCount: expenses.length, totalExpenses, netProfit,
      totalRevenue: salesRevenue + repairRevenue
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
