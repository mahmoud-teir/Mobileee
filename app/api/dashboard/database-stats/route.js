import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireAuth } from '@/lib/auth';
import User from '@/models/User';
import Screen from '@/models/Screen';
import Phone from '@/models/Phone';
import Accessory from '@/models/Accessory';
import Sticker from '@/models/Sticker';
import Customer from '@/models/Customer';
import Supplier from '@/models/Supplier';
import Sale from '@/models/Sale';
import Repair from '@/models/Repair';
import Expense from '@/models/Expense';
import Return from '@/models/Return';
import Installment from '@/models/Installment';
import Product from '@/models/Product';
import Category from '@/models/Category';

export async function GET(request) {
  const user = await getAuthUser(request);
  const err = requireAuth(user);
  if (err) return err;
  try {
    await connectDB();
    const counts = await Promise.all([
      User.countDocuments(), Screen.countDocuments(), Phone.countDocuments(),
      Accessory.countDocuments(), Sticker.countDocuments(), Customer.countDocuments(),
      Supplier.countDocuments(), Sale.countDocuments(), Repair.countDocuments(),
      Expense.countDocuments(), Return.countDocuments(), Installment.countDocuments(),
      Product.countDocuments(), Category.countDocuments()
    ]);
    const [usersCount, screensCount, phonesCount, accessoriesCount, stickersCount,
           customersCount, suppliersCount, salesCount, repairsCount, expensesCount,
           returnsCount, installmentsCount, productsCount, categoriesCount] = counts;
    return NextResponse.json({
      collections: {
        users: { name: 'المستخدمين', count: usersCount },
        screens: { name: 'الشاشات', count: screensCount },
        phones: { name: 'الهواتف', count: phonesCount },
        accessories: { name: 'الإكسسوارات', count: accessoriesCount },
        stickers: { name: 'الاستيكرات', count: stickersCount },
        customers: { name: 'العملاء', count: customersCount },
        suppliers: { name: 'الموردين', count: suppliersCount },
        sales: { name: 'المبيعات', count: salesCount },
        repairs: { name: 'الصيانات', count: repairsCount },
        expenses: { name: 'المصروفات', count: expensesCount },
        returns: { name: 'المرتجعات', count: returnsCount },
        installments: { name: 'الأقساط', count: installmentsCount },
        products: { name: 'المنتجات', count: productsCount },
        categories: { name: 'الأقساط', count: categoriesCount }
      },
      totalRecords: counts.reduce((a, b) => a + b, 0)
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
