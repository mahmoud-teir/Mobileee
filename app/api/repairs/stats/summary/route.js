import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import { getAuthUser, requireAuth } from '../../../../lib/auth';
import Repair from '../../../../models/Repair';

export async function GET(request) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const monthRepairs = await Repair.find({ date: { $gte: startOfMonth, $lte: endOfMonth } });
    const totalRevenue = monthRepairs.reduce((sum, r) => sum + r.cost, 0);
    const totalProfit = monthRepairs.reduce((sum, r) => sum + r.profit, 0);
    const pendingCount = monthRepairs.filter(r => r.status === 'قيد الصيانة').length;
    const readyCount = monthRepairs.filter(r => r.status === 'جاهز').length;
    return NextResponse.json({ totalRevenue, totalProfit, totalRepairs: monthRepairs.length, pendingCount, readyCount });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
