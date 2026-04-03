import { NextResponse } from 'next/server';

export async function POST() {
  // JWT is stateless — client removes token from localStorage
  return NextResponse.json({ message: 'تم تسجيل الخروج بنجاح' });
}
