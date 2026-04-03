const express = require('express');
const router = express.Router();
const Sticker = require('../models/Sticker');

// Get all stickers
router.get('/', async (req, res) => {
  try {
    const stickers = await Sticker.find().sort({ createdAt: -1 });
    res.json(stickers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single sticker
router.get('/:id', async (req, res) => {
  try {
    const sticker = await Sticker.findById(req.params.id);
    if (!sticker) {
      return res.status(404).json({ message: 'Sticker not found' });
    }
    res.json(sticker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create sticker
router.post('/', async (req, res) => {
  const sticker = new Sticker(req.body);
  try {
    const newSticker = await sticker.save();
    res.status(201).json(newSticker);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update sticker
router.put('/:id', async (req, res) => {
  try {
    const sticker = await Sticker.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!sticker) {
      return res.status(404).json({ message: 'Sticker not found' });
    }
    res.json(sticker);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete sticker
router.delete('/:id', async (req, res) => {
  try {
    const sticker = await Sticker.findByIdAndDelete(req.params.id);
    if (!sticker) {
      return res.status(404).json({ message: 'Sticker not found' });
    }
    res.json({ message: 'Sticker deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update quantity
router.patch('/:id/quantity', async (req, res) => {
  try {
    const { quantity } = req.body;
    const sticker = await Sticker.findByIdAndUpdate(
      req.params.id,
      { $inc: { quantity: quantity } },
      { new: true }
    );
    if (!sticker) {
      return res.status(404).json({ message: 'Sticker not found' });
    }
    res.json(sticker);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get low stock stickers
router.get('/alerts/low-stock', async (req, res) => {
  try {
    const stickers = await Sticker.find({
      $expr: { $lte: ['$quantity', '$minQuantity'] }
    });
    res.json(stickers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
