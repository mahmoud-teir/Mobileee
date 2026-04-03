const express = require('express');
const router = express.Router();
const Accessory = require('../models/Accessory');

// Get all accessories
router.get('/', async (req, res) => {
  try {
    const accessories = await Accessory.find().sort({ createdAt: -1 });
    res.json(accessories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single accessory
router.get('/:id', async (req, res) => {
  try {
    const accessory = await Accessory.findById(req.params.id);
    if (!accessory) {
      return res.status(404).json({ message: 'Accessory not found' });
    }
    res.json(accessory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create accessory
router.post('/', async (req, res) => {
  const accessory = new Accessory(req.body);
  try {
    const newAccessory = await accessory.save();
    res.status(201).json(newAccessory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update accessory
router.put('/:id', async (req, res) => {
  try {
    const accessory = await Accessory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!accessory) {
      return res.status(404).json({ message: 'Accessory not found' });
    }
    res.json(accessory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete accessory
router.delete('/:id', async (req, res) => {
  try {
    const accessory = await Accessory.findByIdAndDelete(req.params.id);
    if (!accessory) {
      return res.status(404).json({ message: 'Accessory not found' });
    }
    res.json({ message: 'Accessory deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update quantity
router.patch('/:id/quantity', async (req, res) => {
  try {
    const { quantity } = req.body;
    const accessory = await Accessory.findByIdAndUpdate(
      req.params.id,
      { $inc: { quantity: quantity } },
      { new: true }
    );
    if (!accessory) {
      return res.status(404).json({ message: 'Accessory not found' });
    }
    res.json(accessory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get low stock accessories
router.get('/alerts/low-stock', async (req, res) => {
  try {
    const accessories = await Accessory.find({
      $expr: { $lte: ['$quantity', '$minQuantity'] }
    });
    res.json(accessories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
