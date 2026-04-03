const mongoose = require('mongoose');

const returnItemSchema = new mongoose.Schema({
  item: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['screen', 'phone', 'accessory', 'sticker']
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId
  }
}, { _id: false });

const returnSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  saleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    required: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  refundType: {
    type: String,
    enum: ['full', 'partial', 'exchange'],
    required: true
  },
  refundAmount: {
    type: Number,
    required: true,
    min: 0
  },
  items: [returnItemSchema],
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Return', returnSchema);
