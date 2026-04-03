import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import Sale from '@/models/Sale';

export async function GET(request) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const monthSales = await Sale.find({ date: { $gte: startOfMonth, $lte: endOfMonth } });
    const totalRevenue = monthSales.reduce((sum, s) => sum + s.total, 0);
    const totalProfit = monthSales.reduce((sum, s) => sum + s.profit, 0);
    const totalSales = monthSales.length;
    return NextResponse.json({
      totalRevenue, totalProfit, totalSales,
      averageSale: totalSales > 0 ? totalRevenue / totalSales : 0
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
