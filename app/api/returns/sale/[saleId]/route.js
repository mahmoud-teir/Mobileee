import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/mongodb';
import { getAuthUser, requireAuth } from '../../../../../lib/auth';
import Return from '../../../../../models/Return';

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const returns = await Return.find({ saleId: params.saleId });
    return NextResponse.json(returns);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
