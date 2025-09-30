const mongoose = require('mongoose');
const { Stock } = require('../models');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

const createStock = async (stockBody) => {
  const stockData = {
    ...stockBody,
    quantity: stockBody.quantity || 0
  };
  return Stock.create(stockData);
};

const getStocks = async (filter, options) => {
  return Stock.paginate(filter, options);
};

const getStockById = async (id) => {
  return Stock.findById(id);
};

const updateStockById = async (stockId, updateBody) => {
  const stock = await getStockById(stockId);
  if (!stock) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Stock item not found');
  }

  // Update basic fields
  Object.assign(stock, updateBody);
  await stock.save();
  return stock;
};

const deleteStockById = async (stockId) => {
  const stock = await getStockById(stockId);
  if (!stock) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Stock item not found');
  }
  await stock.remove();
  return stock;
};

const recordStockChange = async (stockId, change, operation) => {
  const stock = await getStockById(stockId);
  if (!stock) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Stock item not found');
  }

  const historyEntry = {
    type: stock.type,
    category: stock.category,
    price: stock.price,
    change: Math.abs(change),
    operation,
    date: new Date()
  };

  stock.history.push(historyEntry);
  stock.quantity += change;
  
  if (stock.quantity < 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Insufficient stock quantity');
  }
  
  await stock.save();
  return stock;
};

const getStockAnalytics = async () => {
  const results = await Stock.aggregate([
    {
      $group: {
        _id: '$category',
        totalItems: { $sum: 1 },
        totalValue: { $sum: { $multiply: ['$price', '$quantity'] } },
        averagePrice: { $avg: '$price' },
        lowStockItems: {
          $sum: {
            $cond: [{ $lte: ['$quantity', 5] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        category: '$_id',
        totalItems: 1,
        totalValue: 1,
        averagePrice: 1,
        lowStockItems: 1,
        _id: 0
      }
    }
  ]);

  const overall = await Stock.aggregate([
    {
      $group: {
        _id: null,
        totalItems: { $sum: 1 },
        totalValue: { $sum: { $multiply: ['$price', '$quantity'] } },
        lowStockItems: {
          $sum: {
            $cond: [{ $lte: ['$quantity', 5] }, 1, 0]
          }
        }
      }
    }
  ]);

  const lowStockItemsList = await Stock.find({ quantity: { $lte: 5 } })
    .select('type category price quantity')
    .sort({ quantity: 1 });

  return {
    byCategory: results,
    overall: overall[0] || {
      totalItems: 0,
      totalValue: 0,
      lowStockItems: 0
    },
    lowStockItemsList
  };
};

const getStockHistory = async (timeframe = 'month') => {
  const now = new Date();
  let startDate = new Date(now);
  
  // Calculate start date based on timeframe
  switch (timeframe) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(now.getMonth() - 1);
  }

  const history = await Stock.aggregate([
    { $unwind: '$history' },
    {
      $match: {
        'history.date': { 
          $gte: startDate,
          $lte: now
        }
      }
    },
    {
      $group: {
        _id: {
          date: {
            $dateToString: {
              format: timeframe === 'year' ? '%Y-%m' : '%Y-%m-%d',
              date: '$history.date'
            }
          },
          operation: '$history.operation'
        },
        totalChange: { $sum: '$history.change' }
      }
    },
    {
      $project: {
        date: '$_id.date',
        operation: '$_id.operation',
        totalChange: 1,
        _id: 0
      }
    },
    { $sort: { date: 1 } }
  ]);

  // Format data for the frontend charts
  const formattedHistory = history.map(item => ({
    ...item,
    totalChange: Number(item.totalChange)
  }));

  return formattedHistory;
};

const getStockForecast = async () => {
  const usageData = await Stock.aggregate([
    { $unwind: '$history' },
    { 
      $match: { 
        'history.operation': 'usage',
        'history.date': { 
          $gte: new Date(new Date().setDate(new Date().getDate() - 30)) 
        }
      } 
    },
    {
      $group: {
        _id: '$type',
        category: { $first: '$category' },
        totalUsage: { $sum: '$history.change' },
        dailyUsage: { $avg: '$history.change' },
        currentQuantity: { $first: '$quantity' }
      }
    },
    {
      $project: {
        item: '$_id',
        category: 1,
        totalUsage: 1,
        dailyUsage: 1,
        currentQuantity: 1,
        daysUntilEmpty: { 
          $divide: ['$currentQuantity', { $max: ['$dailyUsage', 0.1] }] 
        },
        _id: 0
      }
    },
    { $sort: { daysUntilEmpty: 1 } }
  ]);

  return usageData;
};

module.exports = {
  createStock,
  getStocks,
  getStockById,
  updateStockById,
  deleteStockById,
  recordStockChange,
  getStockAnalytics,
  getStockHistory,
  getStockForecast
};