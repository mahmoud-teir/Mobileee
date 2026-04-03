const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Repair = require('../models/Repair');
const Expense = require('../models/Expense');
const Screen = require('../models/Screen');
const Phone = require('../models/Phone');
const Accessory = require('../models/Accessory');
const Sticker = require('../models/Sticker');

// Get dashboard summary
router.get('/summary', async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Get monthly data
    const [sales, repairs, expenses] = await Promise.all([
      Sale.find({ date: { $gte: startOfMonth, $lte: endOfMonth } }),
      Repair.find({ date: { $gte: startOfMonth, $lte: endOfMonth } }),
      Expense.find({ date: { $gte: startOfMonth, $lte: endOfMonth } })
    ]);

    // Calculate totals
    const salesRevenue = sales.reduce((sum, s) => sum + s.total, 0);
    const salesProfit = sales.reduce((sum, s) => sum + s.profit, 0);
    const repairRevenue = repairs.reduce((sum, r) => sum + r.cost, 0);
    const repairProfit = repairs.reduce((sum, r) => sum + r.profit, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const netProfit = salesProfit + repairProfit - totalExpenses;

    res.json({
      salesCount: sales.length,
      salesRevenue,
      salesProfit,
      repairsCount: repairs.length,
      repairRevenue,
      repairProfit,
      expensesCount: expenses.length,
      totalExpenses,
      netProfit,
      totalRevenue: salesRevenue + repairRevenue
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get low stock alerts
router.get('/alerts/low-stock', async (req, res) => {
  try {
    const [screens, phones, accessories, stickers] = await Promise.all([
      Screen.find({ $expr: { $lte: ['$quantity', '$minQuantity'] } }),
      Phone.find({ $expr: { $lte: ['$quantity', '$minQuantity'] } }),
      Accessory.find({ $expr: { $lte: ['$quantity', '$minQuantity'] } }),
      Sticker.find({ $expr: { $lte: ['$quantity', '$minQuantity'] } })
    ]);

    res.json({
      screens,
      phones,
      accessories,
      stickers,
      total: screens.length + phones.length + accessories.length + stickers.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get ready repairs (for notifications)
router.get('/alerts/ready-repairs', async (req, res) => {
  try {
    const repairs = await Repair.find({ status: 'جاهز', notified: false });
    res.json(repairs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get monthly trends
router.get('/trends/monthly', async (req, res) => {
  try {
    const today = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);

      const [sales, repairs, expenses] = await Promise.all([
        Sale.find({ date: { $gte: startOfMonth, $lte: endOfMonth } }),
        Repair.find({ date: { $gte: startOfMonth, $lte: endOfMonth } }),
        Expense.find({ date: { $gte: startOfMonth, $lte: endOfMonth } })
      ]);

      const salesRevenue = sales.reduce((sum, s) => sum + s.total, 0);
      const repairRevenue = repairs.reduce((sum, r) => sum + r.cost, 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const profit = sales.reduce((sum, s) => sum + s.profit, 0) +
                     repairs.reduce((sum, r) => sum + r.profit, 0) -
                     totalExpenses;

      months.push({
        month: startOfMonth.toLocaleString('ar-SA', { month: 'long' }),
        year: startOfMonth.getFullYear(),
        salesRevenue,
        repairRevenue,
        expenses: totalExpenses,
        profit,
        salesCount: sales.length,
        repairsCount: repairs.length
      });
    }

    res.json(months);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get inventory summary
router.get('/inventory/summary', async (req, res) => {
  try {
    const [screens, phones, accessories, stickers] = await Promise.all([
      Screen.find(),
      Phone.find(),
      Accessory.find(),
      Sticker.find()
    ]);

    const calculateValue = (items) => items.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
    const calculateCount = (items) => items.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      screens: {
        types: screens.length,
        quantity: calculateCount(screens),
        value: calculateValue(screens)
      },
      phones: {
        types: phones.length,
        quantity: calculateCount(phones),
        value: calculateValue(phones)
      },
      accessories: {
        types: accessories.length,
        quantity: calculateCount(accessories),
        value: calculateValue(accessories)
      },
      stickers: {
        types: stickers.length,
        quantity: calculateCount(stickers),
        value: calculateValue(stickers)
      },
      totalValue: calculateValue(screens) + calculateValue(phones) +
                  calculateValue(accessories) + calculateValue(stickers)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get database statistics - عرض إحصائيات قاعدة البيانات
router.get('/database-stats', async (req, res) => {
  try {
    const User = require('../models/User');
    const Customer = require('../models/Customer');
    const Supplier = require('../models/Supplier');
    const Return = require('../models/Return');
    const Installment = require('../models/Installment');

    // Get counts for all collections
    const [
      usersCount,
      screensCount,
      phonesCount,
      accessoriesCount,
      stickersCount,
      customersCount,
      suppliersCount,
      salesCount,
      repairsCount,
      expensesCount,
      returnsCount,
      installmentsCount
    ] = await Promise.all([
      User.countDocuments(),
      Screen.countDocuments(),
      Phone.countDocuments(),
      Accessory.countDocuments(),
      Sticker.countDocuments(),
      Customer.countDocuments(),
      Supplier.countDocuments(),
      Sale.countDocuments(),
      Repair.countDocuments(),
      Expense.countDocuments(),
      Return.countDocuments(),
      Installment.countDocuments()
    ]);

    res.json({
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
        installments: { name: 'الأقساط', count: installmentsCount }
      },
      totalRecords: usersCount + screensCount + phonesCount + accessoriesCount +
                    stickersCount + customersCount + suppliersCount + salesCount +
                    repairsCount + expensesCount + returnsCount + installmentsCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all data from a specific collection - عرض جميع البيانات من جدول معين
router.get('/collection/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const models = {
      users: require('../models/User'),
      screens: Screen,
      phones: Phone,
      accessories: Accessory,
      stickers: Sticker,
      customers: require('../models/Customer'),
      suppliers: require('../models/Supplier'),
      sales: Sale,
      repairs: Repair,
      expenses: Expense,
      returns: require('../models/Return'),
      installments: require('../models/Installment')
    };

    const Model = models[name];
    if (!Model) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    const total = await Model.countDocuments();
    let query = Model.find();

    // Remove password from users
    if (name === 'users') {
      query = query.select('-password');
    }

    const data = await query
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    res.json({
      collection: name,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
      data
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
