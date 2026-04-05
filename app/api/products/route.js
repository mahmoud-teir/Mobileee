export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import Product from '@/models/Product';

export async function GET(request) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    // Scoped to storeId
    const query = { storeId: user.currentStoreId };
    if (categoryId) query.categoryId = categoryId;

    const products = await Product.find(query).sort({ createdAt: -1 });
    return NextResponse.json(products);
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
    const body = await request.json();
    body.storeId = user.currentStoreId;
    const product = new Product(body);
    const newProduct = await product.save();
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {}).filter(k => k !== 'storeId').join(' و ');
      return NextResponse.json({
        message: `هذا المنتج موجود بالفعل في متجرك (${field}: ${Object.values(error.keyValue || {}).filter((_, i) => i > 0).join('، ')})`
      }, { status: 400 });
    }
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
