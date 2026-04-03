const express = require('express');
const router = express.Router();
const Repair = require('../models/Repair');
const Screen = require('../models/Screen');

// Get all repairs
router.get('/', async (req, res) => {
  try {
    const repairs = await Repair.find().sort({ date: -1 });
    res.json(repairs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get repairs by status
router.get('/status/:status', async (req, res) => {
  try {
    const repairs = await Repair.find({ status: req.params.status }).sort({ date: -1 });
    res.json(repairs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single repair
router.get('/:id', async (req, res) => {
  try {
    const repair = await Repair.findById(req.params.id);
    if (!repair) {
      return res.status(404).json({ message: 'Repair not found' });
    }
    res.json(repair);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create repair
router.post('/', async (req, res) => {
  try {
    const repairData = req.body;
    console.log('Received repair data:', JSON.stringify(repairData, null, 2));

    // Deduct screen from inventory if used
    if (repairData.useScreen && repairData.screenId) {
      await Screen.findByIdAndUpdate(
        repairData.screenId,
        { $inc: { quantity: -1 } }
      );
    }

    const repair = new Repair(repairData);
    const newRepair = await repair.save();
    console.log('Repair saved successfully:', newRepair._id);
    res.status(201).json(newRepair);
  } catch (error) {
    console.error('Error creating repair:', error.message);
    console.error('Validation errors:', error.errors);
    res.status(400).json({ message: error.message, errors: error.errors });
  }
});

// Update repair
router.put('/:id', async (req, res) => {
  try {
    const repair = await Repair.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!repair) {
      return res.status(404).json({ message: 'Repair not found' });
    }
    res.json(repair);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update repair status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const repair = await Repair.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!repair) {
      return res.status(404).json({ message: 'Repair not found' });
    }
    res.json(repair);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mark as paid
router.patch('/:id/pay', async (req, res) => {
  try {
    const repair = await Repair.findByIdAndUpdate(
      req.params.id,
      { paid: true },
      { new: true }
    );
    if (!repair) {
      return res.status(404).json({ message: 'Repair not found' });
    }
    res.json(repair);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mark as notified
router.patch('/:id/notify', async (req, res) => {
  try {
    const repair = await Repair.findByIdAndUpdate(
      req.params.id,
      { notified: true },
      { new: true }
    );
    if (!repair) {
      return res.status(404).json({ message: 'Repair not found' });
    }
    res.json(repair);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete repair
router.delete('/:id', async (req, res) => {
  try {
    console.log('Attempting to delete repair with id:', req.params.id);
    const repair = await Repair.findById(req.params.id);
    if (!repair) {
      console.log('Repair not found with id:', req.params.id);
      return res.status(404).json({ message: 'Repair not found' });
    }

    // Restore screen to inventory if it was used
    if (repair.useScreen && repair.screenId) {
      await Screen.findByIdAndUpdate(
        repair.screenId,
        { $inc: { quantity: 1 } }
      );
    }

    await Repair.findByIdAndDelete(req.params.id);
    console.log('Repair deleted successfully:', req.params.id);
    res.json({ message: 'Repair deleted successfully' });
  } catch (error) {
    console.error('Error deleting repair:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Get repairs statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const monthRepairs = await Repair.find({
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const totalRevenue = monthRepairs.reduce((sum, r) => sum + r.cost, 0);
    const totalProfit = monthRepairs.reduce((sum, r) => sum + r.profit, 0);
    const pendingCount = monthRepairs.filter(r => r.status === 'قيد الصيانة').length;
    const readyCount = monthRepairs.filter(r => r.status === 'جاهز').length;

    res.json({
      totalRevenue,
      totalProfit,
      totalRepairs: monthRepairs.length,
      pendingCount,
      readyCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
