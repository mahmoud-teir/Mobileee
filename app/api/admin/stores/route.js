import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUser, requireRole } from '@/lib/auth';
import { Store } from '@/models/User';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const user = await getAuthUser(request);
  const roleErr = requireRole(user, 'super_admin');
  if (roleErr) return roleErr;

  try {
    await connectDB();
    const stores = await Store.find().sort({ createdAt: -1 }).lean();
    
    // Enrich stores with owner info
    const enrichedStores = await Promise.all(stores.map(async (store) => {
      const owner = await User.findById(store.ownerId).select('name email username').lean();
      return { ...store, owner };
    }));

    return NextResponse.json(enrichedStores);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await getAuthUser(request);
  const roleErr = requireRole(user, 'super_admin');
  if (roleErr) return roleErr;

  try {
    await connectDB();
    const { name, slug, ownerEmail, ownerUsername, ownerPassword } = await request.json();

    // Check if store slug is taken
    const existingStore = await Store.findOne({ slug });
    if (existingStore) return NextResponse.json({ message: 'رابط المتجر مستخدم بالفعل' }, { status: 400 });

    // Check if owner exists or create new one
    let owner = await User.findOne({ $or: [{ email: ownerEmail }, { username: ownerUsername }] });
    if (owner && owner.role !== 'owner') {
        return NextResponse.json({ message: 'المستخدم موجود بالفعل بصلاحية مختلفة' }, { status: 400 });
    }

    if (!owner) {
        owner = new User({
            username: ownerUsername,
            email: ownerEmail,
            password: ownerPassword || '123456', // Default password
            role: 'owner',
            name: ownerUsername
        });
        await owner.save();
    }

    const newStore = new Store({
      name,
      slug,
      ownerId: owner._id,
      isActive: true,
      subscription: { plan: 'free', status: 'active' }
    });

    await newStore.save();
    
    // Link owner to store
    owner.storeId = newStore._id;
    await owner.save();

    return NextResponse.json(newStore, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function PATCH(request) {
  const user = await getAuthUser(request);
  const roleErr = requireRole(user, 'super_admin');
  if (roleErr) return roleErr;

  try {
    await connectDB();
    const { id, updates } = await request.json();
    
    // Special handling for nested fields if needed, but Mongoose $set works for flat updates
    const updatedStore = await Store.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );

    if (!updatedStore) {
      return NextResponse.json({ message: 'المتجر غير موجود' }, { status: 404 });
    }

    return NextResponse.json(updatedStore);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
