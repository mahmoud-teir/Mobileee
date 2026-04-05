import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import Programming from '@/models/Programming';

export async function GET(request) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;

  try {
    await connectDB();
    const programmingItems = await Programming.find({ storeId: user.currentStoreId });
    
    const totalProgramming = programmingItems.length;
    const totalRevenue = programmingItems.reduce((sum, item) => sum + (item.cost || 0), 0);
    const paidCount = programmingItems.filter(item => item.paid).length;
    const unpaidCount = totalProgramming - paidCount;
    const readyCount = programmingItems.filter(item => item.status === 'جاهز').length;
    const inProgressCount = programmingItems.filter(item => item.status === 'قيد البرمجة').length;
    const deliveredCount = programmingItems.filter(item => item.status === 'تم التسليم').length;

    return NextResponse.json({
      totalProgramming,
      totalRevenue,
      paidCount,
      unpaidCount,
      readyCount,
      inProgressCount,
      deliveredCount
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
