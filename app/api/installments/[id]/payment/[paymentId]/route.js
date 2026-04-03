import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import Installment from '@/models/Installment';

export async function PATCH(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const installment = await Installment.findById(params.id);
    if (!installment) return NextResponse.json({ message: 'Installment not found' }, { status: 404 });

    const payment = installment.payments.id(params.paymentId);
    if (!payment) return NextResponse.json({ message: 'Payment not found' }, { status: 404 });

    payment.paid = true;
    payment.paidDate = new Date();
    await installment.save();

    return NextResponse.json(installment);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
