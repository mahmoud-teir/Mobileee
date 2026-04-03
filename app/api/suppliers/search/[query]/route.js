import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import Supplier from '@/models/Supplier';

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const query = params.query;
    const suppliers = await Supplier.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { products: { $regex: query, $options: 'i' } }
      ]
    });
    return NextResponse.json(suppliers);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
