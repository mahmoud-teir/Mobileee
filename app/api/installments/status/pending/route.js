import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import { getAuthUser, requireAuth } from '../../../../lib/auth';
import Installment from '../../../../models/Installment';

export async function GET(request) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const installments = await Installment.find();
    const pending = installments.filter(inst =>
      inst.payments.some(p => !p.paid && new Date(p.date) <= new Date())
    );
    return NextResponse.json(pending);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
