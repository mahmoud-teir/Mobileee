const mongoose = require('mongoose');

const screenSchema = new mongoose.Schema({
  model: {
    type: String,
    required: true,
    trim: true,
    unique: true
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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Screen', screenSchema);
