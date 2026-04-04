const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
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
    required: true,
    min: 0
  },
  cost: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    enum: ['screen', 'phone', 'accessory', 'sticker', 'product'],
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'items.type'
  }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  customerName: {
    type: String,
    trim: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  items: [saleItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  discountType: {
    type: String,
    enum: ['percentage', 'amount'],
    default: 'amount'
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  profit: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    default: 'نقدي'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Sale', saleSchema);
