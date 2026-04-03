import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import Expense from '@/models/Expense';

export async function GET(request) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const expenses = await Expense.find().sort({ date: -1 });
    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const expense = new Expense(await request.json());
    return NextResponse.json(await expense.save(), { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
