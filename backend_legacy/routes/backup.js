const express = require('express');
const router = express.Router();
const Screen = require('../models/Screen');
const Phone = require('../models/Phone');
const Accessory = require('../models/Accessory');
const Sticker = require('../models/Sticker');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Sale = require('../models/Sale');
const Repair = require('../models/Repair');
const Expense = require('../models/Expense');
const Return = require('../models/Return');
const Installment = require('../models/Installment');

// Export all data (backup)
router.get('/export', async (req, res) => {
  try {
    const [screens, phones, accessories, stickers, customers, suppliers,
           sales, repairs, expenses, returns, installments] = await Promise.all([
      Screen.find(),
      Phone.find(),
      Accessory.find(),
      Sticker.find(),
      Customer.find(),
      Supplier.find(),
      Sale.find(),
      Repair.find(),
      Expense.find(),
      Return.find(),
      Installment.find()
    ]);

    const backup = {
      version: '2.0.0',
      exportDate: new Date().toISOString(),
      data: {
        screens,
        phones,
        accessories,
        stickers,
        customers,
        suppliers,
        sales,
        repairs,
        expenses,
        returns,
        installments
      }
    };

    res.json(backup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Import all data (restore)
router.post('/import', async (req, res) => {
  try {
    const { data, clearExisting } = req.body;

    if (clearExisting) {
      // Clear all existing data
      await Promise.all([
        Screen.deleteMany({}),
        Phone.deleteMany({}),
        Accessory.deleteMany({}),
        Sticker.deleteMany({}),
        Customer.deleteMany({}),
        Supplier.deleteMany({}),
        Sale.deleteMany({}),
        Repair.deleteMany({}),
        Expense.deleteMany({}),
        Return.deleteMany({}),
        Installment.deleteMany({})
      ]);
    }

    // Import new data
    const results = {};

    if (data.screens && data.screens.length > 0) {
      results.screens = await Screen.insertMany(data.screens, { ordered: false }).catch(e => ({ error: e.message }));
    }
    if (data.phones && data.phones.length > 0) {
      results.phones = await Phone.insertMany(data.phones, { ordered: false }).catch(e => ({ error: e.message }));
    }
    if (data.accessories && data.accessories.length > 0) {
      results.accessories = await Accessory.insertMany(data.accessories, { ordered: false }).catch(e => ({ error: e.message }));
    }
    if (data.stickers && data.stickers.length > 0) {
      results.stickers = await Sticker.insertMany(data.stickers, { ordered: false }).catch(e => ({ error: e.message }));
    }
    if (data.customers && data.customers.length > 0) {
      results.customers = await Customer.insertMany(data.customers, { ordered: false }).catch(e => ({ error: e.message }));
    }
    if (data.suppliers && data.suppliers.length > 0) {
      results.suppliers = await Supplier.insertMany(data.suppliers, { ordered: false }).catch(e => ({ error: e.message }));
    }
    if (data.sales && data.sales.length > 0) {
      results.sales = await Sale.insertMany(data.sales, { ordered: false }).catch(e => ({ error: e.message }));
    }
    if (data.repairs && data.repairs.length > 0) {
      results.repairs = await Repair.insertMany(data.repairs, { ordered: false }).catch(e => ({ error: e.message }));
    }
    if (data.expenses && data.expenses.length > 0) {
      results.expenses = await Expense.insertMany(data.expenses, { ordered: false }).catch(e => ({ error: e.message }));
    }
    if (data.returns && data.returns.length > 0) {
      results.returns = await Return.insertMany(data.returns, { ordered: false }).catch(e => ({ error: e.message }));
    }
    if (data.installments && data.installments.length > 0) {
      results.installments = await Installment.insertMany(data.installments, { ordered: false }).catch(e => ({ error: e.message }));
    }

    res.json({
      message: 'Data imported successfully',
      results
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Clear all data
router.delete('/clear', async (req, res) => {
  try {
    await Promise.all([
      Screen.deleteMany({}),
      Phone.deleteMany({}),
      Accessory.deleteMany({}),
      Sticker.deleteMany({}),
      Customer.deleteMany({}),
      Supplier.deleteMany({}),
      Sale.deleteMany({}),
      Repair.deleteMany({}),
      Expense.deleteMany({}),
      Return.deleteMany({}),
      Installment.deleteMany({})
    ]);

    res.json({ message: 'All data cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
