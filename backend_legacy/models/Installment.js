const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  paid: {
    type: Boolean,
    default: false
  },
  paidDate: {
    type: Date
  }
}, { _id: true });

const installmentItemSchema = new mongoose.Schema({
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

const installmentSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  downPayment: {
    type: Number,
    default: 0,
    min: 0
  },
  numberOfInstallments: {
    type: Number,
    required: true,
    min: 1
  },
  startDate: {
    type: Date,
    required: true
  },
  items: [installmentItemSchema],
  payments: [paymentSchema],
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Installment', installmentSchema);
