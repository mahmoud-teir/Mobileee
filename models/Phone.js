const mongoose = require('mongoose');

const phoneSchema = new mongoose.Schema({
  model: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  minQuantity: {
    type: Number,
    default: 5,
    min: 0
  },
  description: {
    type: String,
    trim: true
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

phoneSchema.index({ storeId: 1, model: 1 }, { unique: true });

module.exports = mongoose.models.Phone || mongoose.model('Phone', phoneSchema);
