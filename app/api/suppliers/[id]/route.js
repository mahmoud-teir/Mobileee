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
    const supplier = await Supplier.findOne({ _id: params.id, storeId: user.currentStoreId });
    if (!supplier) return NextResponse.json({ message: 'Supplier not found' }, { status: 404 });
    return NextResponse.json(supplier);
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
    const supplier = await Supplier.findOneAndUpdate(
      { _id: params.id, storeId: user.currentStoreId }, 
      await request.json(), 
      { new: true, runValidators: true }
    );
    if (!supplier) return NextResponse.json({ message: 'Supplier not found' }, { status: 404 });
    return NextResponse.json(supplier);
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
    const supplier = await Supplier.findOneAndDelete({ _id: params.id, storeId: user.currentStoreId });
    if (!supplier) return NextResponse.json({ message: 'Supplier not found' }, { status: 404 });
    return NextResponse.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
