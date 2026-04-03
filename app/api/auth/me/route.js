import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }
    return NextResponse.json(user.toJSON());
  } catch (error) {
    return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
  }
}
