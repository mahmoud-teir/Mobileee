const mongoose = require('mongoose');

const programmingSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  device: {
    type: String,
    required: true,
    trim: true
  },
  programmingType: {
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
    enum: ['قيد البرمجة', 'في الانتظار', 'جاهز', 'تم التسليم'],
    default: 'قيد البرمجة'
  },
  paid: {
    type: Boolean,
    default: false
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

module.exports = mongoose.models.Programming || mongoose.model('Programming', programmingSchema);
