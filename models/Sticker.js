const mongoose = require('mongoose');

const stickerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
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

stickerSchema.index({ storeId: 1, name: 1 }, { unique: true });

module.exports = mongoose.models.Sticker || mongoose.model('Sticker', stickerSchema);
