import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/mongodb';
import { getAuthUser, requireAuth } from '../../../../../lib/auth';
import Customer from '../../../../../models/Customer';

export async function PATCH(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const { amount } = await request.json();
    const customer = await Customer.findByIdAndUpdate(
      params.id,
      { $inc: { totalPurchases: amount }, lastPurchase: new Date() },
      { new: true }
    );
    if (!customer) return NextResponse.json({ message: 'Customer not found' }, { status: 404 });
    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
