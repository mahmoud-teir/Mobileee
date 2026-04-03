const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Screen = require('../models/Screen');
const Phone = require('../models/Phone');
const Accessory = require('../models/Accessory');
const Sticker = require('../models/Sticker');
const Customer = require('../models/Customer');

// Get model by type
const getModelByType = (type) => {
  switch (type) {
    case 'screen': return Screen;
    case 'phone': return Phone;
    case 'accessory': return Accessory;
    case 'sticker': return Sticker;
    default: return null;
  }
};

// Get all sales
router.get('/', async (req, res) => {
  try {
    const sales = await Sale.find().sort({ date: -1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get sales by date range
router.get('/range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const sales = await Sale.find(query).sort({ date: -1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single sale
router.get('/:id', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create sale
router.post('/', async (req, res) => {
  try {
    const saleData = req.body;

    // Deduct inventory for each item
    for (const item of saleData.items) {
      const Model = getModelByType(item.type);
      if (Model && item.productId) {
        await Model.findByIdAndUpdate(
          item.productId,
          { $inc: { quantity: -item.quantity } }
        );
      }
    }

    // Update customer purchase stats if customer exists
    if (saleData.customerId) {
      await Customer.findByIdAndUpdate(
        saleData.customerId,
        {
          $inc: { totalPurchases: saleData.total },
          lastPurchase: new Date()
        }
      );
    }

    const sale = new Sale(saleData);
    const newSale = await sale.save();
    res.status(201).json(newSale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update sale
router.put('/:id', async (req, res) => {
  try {
    const sale = await Sale.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    res.json(sale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete sale
router.delete('/:id', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Restore inventory for each item
    for (const item of sale.items) {
      const Model = getModelByType(item.type);
      if (Model && item.productId) {
        await Model.findByIdAndUpdate(
          item.productId,
          { $inc: { quantity: item.quantity } }
        );
      }
    }

    await Sale.findByIdAndDelete(req.params.id);
    res.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete sales by date range
router.delete('/range/delete', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const result = await Sale.deleteMany(query);
    res.json({ message: `${result.deletedCount} sales deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get sales statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const monthSales = await Sale.find({
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const totalRevenue = monthSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalProfit = monthSales.reduce((sum, sale) => sum + sale.profit, 0);
    const totalSales = monthSales.length;

    res.json({
      totalRevenue,
      totalProfit,
      totalSales,
      averageSale: totalSales > 0 ? totalRevenue / totalSales : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
