const mongoose = require('mongoose');

const repairSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  device: {
    type: String,
    required: true,
    trim: true
  },
  problem: {
    type: String,
    required: true,
    trim: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['قيد الصيانة', 'في الانتظار', 'جاهز', 'تم التسليم'],
    default: 'قيد الصيانة'
  },
  paid: {
    type: Boolean,
    default: false
  },
  useScreen: {
    type: Boolean,
    default: false
  },
  screenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Screen'
  },
  screenName: {
    type: String,
    trim: true
  },
  screenCost: {
    type: Number,
    default: 0
  },
  profit: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  },
  notified: {
    type: Boolean,
    default: false
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Repair || mongoose.model('Repair', repairSchema);
