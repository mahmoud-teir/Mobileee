const express = require('express');
const router = express.Router();
const Phone = require('../models/Phone');

// Get all phones
router.get('/', async (req, res) => {
  try {
    const phones = await Phone.find().sort({ createdAt: -1 });
    res.json(phones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single phone
router.get('/:id', async (req, res) => {
  try {
    const phone = await Phone.findById(req.params.id);
    if (!phone) {
      return res.status(404).json({ message: 'Phone not found' });
    }
    res.json(phone);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create phone
router.post('/', async (req, res) => {
  const phone = new Phone(req.body);
  try {
    const newPhone = await phone.save();
    res.status(201).json(newPhone);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update phone
router.put('/:id', async (req, res) => {
  try {
    const phone = await Phone.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!phone) {
      return res.status(404).json({ message: 'Phone not found' });
    }
    res.json(phone);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete phone
router.delete('/:id', async (req, res) => {
  try {
    const phone = await Phone.findByIdAndDelete(req.params.id);
    if (!phone) {
      return res.status(404).json({ message: 'Phone not found' });
    }
    res.json({ message: 'Phone deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update quantity
router.patch('/:id/quantity', async (req, res) => {
  try {
    const { quantity } = req.body;
    const phone = await Phone.findByIdAndUpdate(
      req.params.id,
      { $inc: { quantity: quantity } },
      { new: true }
    );
    if (!phone) {
      return res.status(404).json({ message: 'Phone not found' });
    }
    res.json(phone);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get low stock phones
router.get('/alerts/low-stock', async (req, res) => {
  try {
    const phones = await Phone.find({
      $expr: { $lte: ['$quantity', '$minQuantity'] }
    });
    res.json(phones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
