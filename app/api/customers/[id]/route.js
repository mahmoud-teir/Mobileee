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
    const customer = await Customer.findById(params.id);
    if (!customer) return NextResponse.json({ message: 'Customer not found' }, { status: 404 });
    return NextResponse.json(customer);
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
    const customer = await Customer.findByIdAndUpdate(params.id, await request.json(), { new: true, runValidators: true });
    if (!customer) return NextResponse.json({ message: 'Customer not found' }, { status: 404 });
    return NextResponse.json(customer);
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
    const customer = await Customer.findByIdAndDelete(params.id);
    if (!customer) return NextResponse.json({ message: 'Customer not found' }, { status: 404 });
    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
