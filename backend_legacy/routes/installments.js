const express = require('express');
const router = express.Router();
const Installment = require('../models/Installment');
const Screen = require('../models/Screen');
const Phone = require('../models/Phone');
const Accessory = require('../models/Accessory');
const Sticker = require('../models/Sticker');

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

// Get all installments
router.get('/', async (req, res) => {
  try {
    const installments = await Installment.find().sort({ createdAt: -1 });
    res.json(installments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single installment
router.get('/:id', async (req, res) => {
  try {
    const installment = await Installment.findById(req.params.id);
    if (!installment) {
      return res.status(404).json({ message: 'Installment not found' });
    }
    res.json(installment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create installment
router.post('/', async (req, res) => {
  try {
    const installmentData = req.body;

    // Deduct inventory for each item
    for (const item of installmentData.items) {
      const Model = getModelByType(item.type);
      if (Model && item.productId) {
        await Model.findByIdAndUpdate(
          item.productId,
          { $inc: { quantity: -item.quantity } }
        );
      }
    }

    const installment = new Installment(installmentData);
    const newInstallment = await installment.save();
    res.status(201).json(newInstallment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update installment
router.put('/:id', async (req, res) => {
  try {
    const installment = await Installment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!installment) {
      return res.status(404).json({ message: 'Installment not found' });
    }
    res.json(installment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Record payment
router.patch('/:id/payment/:paymentId', async (req, res) => {
  try {
    const installment = await Installment.findById(req.params.id);
    if (!installment) {
      return res.status(404).json({ message: 'Installment not found' });
    }

    const payment = installment.payments.id(req.params.paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    payment.paid = true;
    payment.paidDate = new Date();
    await installment.save();

    res.json(installment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete installment
router.delete('/:id', async (req, res) => {
  try {
    const installment = await Installment.findById(req.params.id);
    if (!installment) {
      return res.status(404).json({ message: 'Installment not found' });
    }

    // Restore inventory for each item
    for (const item of installment.items) {
      const Model = getModelByType(item.type);
      if (Model && item.productId) {
        await Model.findByIdAndUpdate(
          item.productId,
          { $inc: { quantity: item.quantity } }
        );
      }
    }

    await Installment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Installment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get pending installments (with overdue payments)
router.get('/status/pending', async (req, res) => {
  try {
    const installments = await Installment.find();
    const pending = installments.filter(inst => {
      return inst.payments.some(p => !p.paid && new Date(p.date) <= new Date());
    });
    res.json(pending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
