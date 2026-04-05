import jwt from 'jsonwebtoken';
import { connectDB } from './mongodb';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET;

export function signToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
}

// Multi-tenant auth user fetcher
export async function getAuthUser(request) {
  const authHeader = request.headers.get('authorization');
  const storeSlug = request.headers.get('x-store-slug');

  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    await connectDB();

    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) return null;

    // Get store from slug (priority) or fallback to user's assigned store
    let store = null;
    if (storeSlug) {
      const { Store } = await import('../models/User');
      store = await Store.findOne({ slug: storeSlug, isActive: true });
      if (!store) return null;

      // Multi-tenant check: User must belong to the store or be a super_admin
      if (user.role !== 'super_admin' && user.storeId?.toString() !== store._id.toString()) {
        return null;
      }
    } else if (user.storeId) {
      // Fallback: use user's assigned store
      const { Store } = await import('../models/User');
      store = await Store.findById(user.storeId);
      if (!store || !store.isActive) return null;
    }

    // Reject if no store could be resolved
    if (!store) return null;

    // Attach store info to user for convenience in handlers
    user.currentStoreId = store._id;
    user.currentStore = store;

    // Add store info to toJSON output
    const userObj = user.toJSON();
    userObj.storeSlug = store.slug;
    userObj.currentStoreId = store._id;
    userObj.currentStore = store;

    return userObj;
  } catch (error) {
    console.error('Auth Error:', error);
    return null;
  }
}

export function requireAuth(user) {
  if (!user) {
    return Response.json({ message: 'غير مصرح' }, { status: 401 });
  }
  return null; // null means auth passed
}

export function requireRole(user, ...roles) {
  const authError = requireAuth(user);
  if (authError) return authError;

  // Super admin has all permissions
  if (user.role === 'super_admin' || roles.includes(user.role)) {
    return null;
  }

  return Response.json({ message: 'غير مصرح لك' }, { status: 403 });
}
