import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireRole } from '@/lib/auth';
import { Store } from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user || !user.storeId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const store = await Store.findById(user.currentStoreId).lean();
    if (!store) {
      return NextResponse.json({ message: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json(store);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const user = await getAuthUser(request);
  // Owners and Admins can update their own store settings
  const roleErr = requireRole(user, 'owner', 'admin', 'super_admin');
  if (roleErr) return roleErr;
  if (!user.currentStoreId) return NextResponse.json({ message: 'Store ID required' }, { status: 401 });

  try {
    await connectDB();
    const { updates } = await request.json();

    // Prevent updating critical fields like slug or ownerId via this route
    const safeUpdates = { ...updates };
    delete safeUpdates.slug;
    delete safeUpdates.ownerId;
    delete safeUpdates._id;

    const updatedStore = await Store.findByIdAndUpdate(
      user.currentStoreId,
      { $set: safeUpdates },
      { new: true }
    );

    if (!updatedStore) {
      return NextResponse.json({ message: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json(updatedStore);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
