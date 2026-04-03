const express = require('express');
const router = express.Router();
const Return = require('../models/Return');
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

// Get all returns
router.get('/', async (req, res) => {
  try {
    const returns = await Return.find().sort({ date: -1 });
    res.json(returns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single return
router.get('/:id', async (req, res) => {
  try {
    const returnDoc = await Return.findById(req.params.id);
    if (!returnDoc) {
      return res.status(404).json({ message: 'Return not found' });
    }
    res.json(returnDoc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create return
router.post('/', async (req, res) => {
  try {
    const returnData = req.body;

    // Restore inventory for returned items
    for (const item of returnData.items) {
      const Model = getModelByType(item.type);
      if (Model && item.productId) {
        await Model.findByIdAndUpdate(
          item.productId,
          { $inc: { quantity: item.quantity } }
        );
      }
    }

    const returnDoc = new Return(returnData);
    const newReturn = await returnDoc.save();
    res.status(201).json(newReturn);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update return
router.put('/:id', async (req, res) => {
  try {
    const returnDoc = await Return.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!returnDoc) {
      return res.status(404).json({ message: 'Return not found' });
    }
    res.json(returnDoc);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete return
router.delete('/:id', async (req, res) => {
  try {
    const returnDoc = await Return.findById(req.params.id);
    if (!returnDoc) {
      return res.status(404).json({ message: 'Return not found' });
    }

    // Deduct inventory again (undo the return)
    for (const item of returnDoc.items) {
      const Model = getModelByType(item.type);
      if (Model && item.productId) {
        await Model.findByIdAndUpdate(
          item.productId,
          { $inc: { quantity: -item.quantity } }
        );
      }
    }

    await Return.findByIdAndDelete(req.params.id);
    res.json({ message: 'Return deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get returns by sale
router.get('/sale/:saleId', async (req, res) => {
  try {
    const returns = await Return.find({ saleId: req.params.saleId });
    res.json(returns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
