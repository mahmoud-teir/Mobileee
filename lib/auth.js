import jwt from 'jsonwebtoken';
import { connectDB } from './mongodb';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET;

export function signToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
}

// Call this inside API route handlers instead of using middleware
export async function getAuthUser(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    await connectDB();
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) return null;
    return user;
  } catch {
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
  if (!roles.includes(user.role)) {
    return Response.json({ message: 'غير مصرح لك' }, { status: 403 });
  }
  return null;
}
