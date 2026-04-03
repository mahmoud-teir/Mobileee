const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - require authentication
const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'غير مصرح - يرجى تسجيل الدخول' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'المستخدم غير موجود' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'الحساب معطل' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'غير مصرح - جلسة غير صالحة' });
  }
};

// Require specific roles
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'غير مصرح' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'ليس لديك صلاحية للقيام بهذا الإجراء' });
    }

    next();
  };
};

// Admin only
const adminOnly = requireRole('admin');

// Admin or manager
const managerOrAdmin = requireRole('admin', 'manager');

module.exports = {
  protect,
  requireRole,
  adminOnly,
  managerOrAdmin
};
