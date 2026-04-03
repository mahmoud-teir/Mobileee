import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import Sale from '@/models/Sale';

export async function DELETE(request) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const query = {};
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    const result = await Sale.deleteMany(query);
    return NextResponse.json({ message: `${result.deletedCount} sales deleted successfully` });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
