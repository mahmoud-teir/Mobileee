export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import Category from '@/models/Category';
import Product from '@/models/Product';

export async function DELETE(request, { params }) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;

  try {
    await connectDB();
    
    // Check if category has products
    const productCount = await Product.countDocuments({ categoryId: params.id });
    if (productCount > 0) {
      return NextResponse.json({ message: 'لا يمكن حذف القسم لأنه يحتوي على منتجات' }, { status: 400 });
    }

    const category = await Category.findByIdAndDelete(params.id);
    if (!category) return NextResponse.json({ message: 'القسم غير موجود' }, { status: 404 });
    
    return NextResponse.json({ message: 'تم حذف القسم بنجاح' });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
