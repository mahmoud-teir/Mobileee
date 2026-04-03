const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// جميع المسارات محمية وللمدير فقط
router.use(protect);
router.use(adminOnly);

// الحصول على جميع المستخدمين
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// الحصول على مستخدم واحد
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// إنشاء مستخدم جديد
router.post('/', async (req, res) => {
  try {
    const { username, email, password, name, role } = req.body;

    // التحقق من عدم وجود المستخدم
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email
          ? 'البريد الإلكتروني مستخدم بالفعل'
          : 'اسم المستخدم مستخدم بالفعل'
      });
    }

    const user = new User({
      username,
      email,
      password,
      name: name || username,
      role: role || 'employee'
    });

    await user.save();

    res.status(201).json({
      message: 'تم إنشاء المستخدم بنجاح',
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// تحديث مستخدم
router.put('/:id', async (req, res) => {
  try {
    const { username, email, password, name, role } = req.body;
    const userId = req.params.id;

    // التحقق من عدم تكرار البيانات
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
      _id: { $ne: userId }
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email
          ? 'البريد الإلكتروني مستخدم بالفعل'
          : 'اسم المستخدم مستخدم بالفعل'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    // تحديث البيانات
    user.username = username || user.username;
    user.email = email || user.email;
    user.name = name || user.name;
    user.role = role || user.role;

    // تحديث كلمة المرور إذا تم توفيرها
    if (password) {
      user.password = password;
    }

    await user.save();

    res.json({
      message: 'تم تحديث المستخدم بنجاح',
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// تفعيل/تعطيل مستخدم
router.patch('/:id/toggle-active', async (req, res) => {
  try {
    const { isActive } = req.body;
    const userId = req.params.id;

    // منع تعطيل النفس
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'لا يمكنك تعطيل حسابك الخاص' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    res.json({
      message: isActive ? 'تم تفعيل المستخدم' : 'تم تعطيل المستخدم',
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// حذف مستخدم
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    // منع حذف النفس
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'لا يمكنك حذف حسابك الخاص' });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    res.json({ message: 'تم حذف المستخدم بنجاح' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// إعادة تعيين كلمة المرور
router.patch('/:id/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'تم إعادة تعيين كلمة المرور بنجاح' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
