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
    enum: ['Oil', 'Tire', 'Brake', 'Filter', 'Battery'],
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
}, { 
  timestamps: true,
  _id: true 
});

const stockSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Oil', 'Tire', 'Brake', 'Filter', 'Battery'],
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
    minStockLevel: {
      type: Number,
      default: 5,
      min: 0
    },
    history: [stockHistorySchema],
  },
  {
    timestamps: true,
  }
);

// Add plugins
stockSchema.plugin(toJSON);
stockSchema.plugin(paginate);

/**
 * Check if quantity is below minimum stock level
 */
stockSchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.minStockLevel;
});

/**
 * @typedef Stock
 */
const Stock = mongoose.model('Stock', stockSchema);

module.exports = Stock;