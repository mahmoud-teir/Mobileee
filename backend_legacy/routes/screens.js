const express = require('express');
const router = express.Router();
const Screen = require('../models/Screen');

// Get all screens
router.get('/', async (req, res) => {
  try {
    const screens = await Screen.find().sort({ createdAt: -1 });
    res.json(screens);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single screen
router.get('/:id', async (req, res) => {
  try {
    const screen = await Screen.findById(req.params.id);
    if (!screen) {
      return res.status(404).json({ message: 'Screen not found' });
    }
    res.json(screen);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create screen
router.post('/', async (req, res) => {
  const screen = new Screen(req.body);
  try {
    const newScreen = await screen.save();
    res.status(201).json(newScreen);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update screen
router.put('/:id', async (req, res) => {
  try {
    const screen = await Screen.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!screen) {
      return res.status(404).json({ message: 'Screen not found' });
    }
    res.json(screen);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete screen
router.delete('/:id', async (req, res) => {
  try {
    const screen = await Screen.findByIdAndDelete(req.params.id);
    if (!screen) {
      return res.status(404).json({ message: 'Screen not found' });
    }
    res.json({ message: 'Screen deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update quantity
router.patch('/:id/quantity', async (req, res) => {
  try {
    const { quantity } = req.body;
    const screen = await Screen.findByIdAndUpdate(
      req.params.id,
      { $inc: { quantity: quantity } },
      { new: true }
    );
    if (!screen) {
      return res.status(404).json({ message: 'Screen not found' });
    }
    res.json(screen);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get low stock screens
router.get('/alerts/low-stock', async (req, res) => {
  try {
    const screens = await Screen.find({
      $expr: { $lte: ['$quantity', '$minQuantity'] }
    });
    res.json(screens);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
