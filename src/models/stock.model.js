const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const stockHistorySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['Oil', 'Tire', 'Brake'],
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  change: {
    type: Number,
    required: true,
  },
  operation: {
    type: String,
    enum: ['restock', 'usage'],
    required: true,
  },
}, { timestamps: true });

const stockSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Oil', 'Tire', 'Brake'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    history: {
      type: [stockHistorySchema],
      default: []
    },
  },
  {
    timestamps: true,
  }
);

// Add plugins
stockSchema.plugin(toJSON);
stockSchema.plugin(paginate);

/**
 * @typedef Stock
 */
const Stock = mongoose.model('Stock', stockSchema);

module.exports = Stock;