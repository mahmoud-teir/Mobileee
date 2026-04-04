export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import Expense from '@/models/Expense';

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const expense = await Expense.findOne({ _id: params.id, storeId: user.currentStoreId });
    if (!expense) return NextResponse.json({ message: 'Expense not found' }, { status: 404 });
    return NextResponse.json(expense);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const expense = await Expense.findOneAndUpdate(
      { _id: params.id, storeId: user.currentStoreId }, 
      await request.json(), 
      { new: true, runValidators: true }
    );
    if (!expense) return NextResponse.json({ message: 'Expense not found' }, { status: 404 });
    return NextResponse.json(expense);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const expense = await Expense.findOneAndDelete({ _id: params.id, storeId: user.currentStoreId });
    if (!expense) return NextResponse.json({ message: 'Expense not found' }, { status: 404 });
    return NextResponse.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
