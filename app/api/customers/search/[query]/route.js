import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import Customer from '@/models/Customer';

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const query = params.query;
    const customers = await Customer.find({
      storeId: user.currentStoreId,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    });
    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
