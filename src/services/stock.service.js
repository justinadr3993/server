const mongoose = require('mongoose');
const { Stock } = require('../models');

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
    throw new Error('Stock item not found');
  }

  if (updateBody.quantity !== undefined && updateBody.quantity !== stock.quantity) {
    const change = updateBody.quantity - stock.quantity;
    const operation = change > 0 ? 'restock' : 'usage';
    
    // Create date with Philippines timezone (UTC+8)
    const phDate = new Date();
    phDate.setHours(phDate.getHours() + 8); // Adjust to Philippines time
    
    stock.history.push({
      type: stock.type,
      category: stock.category,
      price: stock.price,
      change: Math.abs(change),
      operation,
      createdAt: phDate // Explicitly set the date with timezone adjustment
    });
  }

  Object.assign(stock, updateBody);
  await stock.save();
  return stock;
};

const deleteStockById = async (stockId) => {
  const stock = await getStockById(stockId);
  if (!stock) {
    throw new Error('Stock item not found');
  }
  await stock.remove();
  return stock;
};

const recordStockChange = async (stockId, change, operation) => {
  const stock = await getStockById(stockId);
  if (!stock) {
    throw new Error('Stock item not found');
  }

  // Calculate the actual change based on operation
  let actualChange = change;
  if (operation === 'usage') {
    actualChange = -change; // Make it negative for usage
  }

  // Create date with Philippines timezone (UTC+8)
  const phDate = new Date();
  phDate.setHours(phDate.getHours() + 8); // Adjust to Philippines time

  stock.history.push({
    type: stock.type,
    category: stock.category,
    price: stock.price,
    change: Math.abs(change),
    operation,
    createdAt: phDate // Explicitly set the date with timezone adjustment
  });

  stock.quantity += actualChange;
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

  // Get usage and restock trends
  const trends = await Stock.aggregate([
    { $unwind: '$history' },
    {
      $group: {
        _id: {
          category: '$history.category',
          operation: '$history.operation'
        },
        totalChange: { $sum: '$history.change' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        category: '$_id.category',
        operation: '$_id.operation',
        totalChange: 1,
        averageChange: { $divide: ['$totalChange', '$count'] },
        _id: 0
      }
    }
  ]);

  return {
    byCategory: results,
    overall: overall[0] || {
      totalItems: 0,
      totalValue: 0,
      lowStockItems: 0
    },
    lowStockItemsList,
    trends: []
  };
};

const getStockForecast = async () => {
  const usageData = await Stock.aggregate([
    { $unwind: '$history' },
    { 
      $match: { 
        'history.operation': 'usage',
        'history.createdAt': { 
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
          $divide: ['$currentQuantity', '$dailyUsage'] 
        },
        _id: 0
      }
    },
    { $sort: { daysUntilEmpty: 1 } }
  ]);

  return usageData;
};

const getStockHistory = async (timeframe = 'month') => {
  const now = new Date();
  const startDate = new Date(now);
  
  if (timeframe === 'week') {
    startDate.setDate(now.getDate() - 7);
  } else if (timeframe === 'month') {
    startDate.setMonth(now.getMonth() - 1);
  } else if (timeframe === 'year') {
    startDate.setFullYear(now.getFullYear() - 1);
  }

  startDate.setHours(0, 0, 0, 0);
  now.setHours(23, 59, 59, 999);

  const history = await Stock.aggregate([
    { $unwind: '$history' },
    {
      $match: {
        'history.createdAt': { 
          $gte: startDate,
          $lte: now
        }
      }
    },
    {
      $project: {
        stockId: '$_id',
        stockType: '$type', 
        stockCategory: '$category',
        date: {
          $dateToString: {
            format: timeframe === 'year' ? '%Y-%m' : '%Y-%m-%d',
            date: '$history.createdAt',
            timezone: '+08:00' // Add Philippines timezone
          }
        },
        operation: '$history.operation',
        change: '$history.change',
        price: '$history.price',
        actualDate: '$history.createdAt'
      }
    },
    {
      $group: {
        _id: {
          date: '$date',
          operation: '$operation',
          stockId: '$stockId'
        },
        totalChange: { $sum: '$change' },
        stockType: { $first: '$stockType' }, 
        stockCategory: { $first: '$stockCategory' },
        price: { $first: '$price' },
        actualDate: { $first: '$actualDate' }
      }
    },
    {
      $project: {
        date: '$_id.date',
        operation: '$_id.operation',
        stockId: '$_id.stockId',
        stockType: 1,
        stockCategory: 1,
        price: 1,
        totalChange: 1,
        actualDate: 1,
        _id: 0
      }
    },
    { $sort: { actualDate: 1, stockType: 1 } }
  ]);

  return history;
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