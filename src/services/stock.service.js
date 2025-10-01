const { Stock } = require('../models');

const createStock = async (stockBody) => {
  const stockData = {
    ...stockBody,
    quantity: stockBody.quantity || 0
  };
  return Stock.create(stockData);
};

const getStocks = async (filter, options) => {
  const stocks = await Stock.paginate(filter, options);
  return stocks;
};

const getStockById = async (id) => {
  return Stock.findById(id);
};

const updateStockById = async (stockId, updateBody) => {
  const stock = await getStockById(stockId);
  if (!stock) {
    throw new Error('Stock item not found');
  }

  // If quantity is being updated, record the change in history
  if (updateBody.quantity !== undefined && updateBody.quantity !== stock.quantity) {
    const change = updateBody.quantity - stock.quantity;
    const operation = change > 0 ? 'restock' : 'usage';
    
    stock.history.push({
      type: stock.type,
      category: stock.category,
      price: stock.price,
      change: Math.abs(change),
      operation
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
  await Stock.findByIdAndDelete(stockId);
  return stock;
};

const recordStockChange = async (stockId, change, operation) => {
  const stock = await getStockById(stockId);
  if (!stock) {
    throw new Error('Stock item not found');
  }

  // Validate operation
  if (operation === 'usage' && stock.quantity + change < 0) {
    throw new Error('Insufficient stock for this operation');
  }

  stock.history.push({
    type: stock.type,
    category: stock.category,
    price: stock.price,
    change: Math.abs(change),
    operation
  });

  stock.quantity += change;
  await stock.save();
  return stock;
};

const getStockAnalytics = async () => {
  // Category-wise analytics
  const categoryResults = await Stock.aggregate([
    {
      $group: {
        _id: '$category',
        totalItems: { $sum: 1 },
        totalValue: { $sum: { $multiply: ['$price', '$quantity'] } },
        totalQuantity: { $sum: '$quantity' },
        averagePrice: { $avg: '$price' },
        lowStockItems: {
          $sum: {
            $cond: [{ $lte: ['$quantity', '$minStockLevel'] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        category: '$_id',
        totalItems: 1,
        totalValue: 1,
        totalQuantity: 1,
        averagePrice: 1,
        lowStockItems: 1,
        _id: 0
      }
    },
    { $sort: { category: 1 } }
  ]);

  // Overall analytics
  const overall = await Stock.aggregate([
    {
      $group: {
        _id: null,
        totalItems: { $sum: 1 },
        totalValue: { $sum: { $multiply: ['$price', '$quantity'] } },
        totalQuantity: { $sum: '$quantity' },
        lowStockItems: {
          $sum: {
            $cond: [{ $lte: ['$quantity', '$minStockLevel'] }, 1, 0]
          }
        },
        averageStockValue: { $avg: { $multiply: ['$price', '$quantity'] } }
      }
    }
  ]);

  // Low stock items
  const lowStockItemsList = await Stock.find({ 
    $expr: { $lte: ['$quantity', '$minStockLevel'] } 
  })
    .select('type category price quantity minStockLevel')
    .sort({ quantity: 1 });

  // Usage trends
  const trends = await Stock.aggregate([
    { $unwind: '$history' },
    {
      $group: {
        _id: {
          category: '$history.category',
          operation: '$history.operation'
        },
        totalChange: { $sum: '$history.change' },
        count: { $sum: 1 },
        totalValue: { $sum: { $multiply: ['$history.price', '$history.change'] } }
      }
    },
    {
      $project: {
        category: '$_id.category',
        operation: '$_id.operation',
        totalChange: 1,
        totalValue: 1,
        averageChange: { $divide: ['$totalChange', '$count'] },
        _id: 0
      }
    }
  ]);

  return {
    byCategory: categoryResults,
    overall: overall[0] || {
      totalItems: 0,
      totalValue: 0,
      totalQuantity: 0,
      lowStockItems: 0,
      averageStockValue: 0
    },
    lowStockItemsList,
    trends
  };
};

const getStockForecast = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const usageData = await Stock.aggregate([
    { $unwind: '$history' },
    { 
      $match: { 
        'history.operation': 'usage',
        'history.createdAt': { 
          $gte: thirtyDaysAgo
        }
      } 
    },
    {
      $group: {
        _id: '$_id',
        type: { $first: '$type' },
        category: { $first: '$category' },
        totalUsage: { $sum: '$history.change' },
        usageDays: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$history.createdAt' } } },
        currentQuantity: { $first: '$quantity' }
      }
    },
    {
      $project: {
        item: '$type',
        category: 1,
        totalUsage: 1,
        dailyUsage: { $divide: ['$totalUsage', { $size: '$usageDays' }] },
        currentQuantity: 1,
        daysUntilEmpty: { 
          $cond: [
            { $gt: ['$totalUsage', 0] },
            { $divide: ['$currentQuantity', { $divide: ['$totalUsage', 30] }] },
            0
          ]
        },
        _id: 0
      }
    },
    { $sort: { daysUntilEmpty: 1 } }
  ]);

  return usageData.filter(item => item.dailyUsage > 0);
};

const getStockHistory = async (timeframe = 'month') => {
  const now = new Date();
  let startDate = new Date(now);
  
  // Set time ranges based on timeframe
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

  // Reset time components
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
        date: {
          $dateToString: {
            format: timeframe === 'year' ? '%Y-%m' : '%Y-%m-%d',
            date: '$history.createdAt'
          }
        },
        operation: '$history.operation',
        change: '$history.change',
        category: '$history.category'
      }
    },
    {
      $group: {
        _id: {
          date: '$date',
          operation: '$operation',
          category: '$category'
        },
        totalChange: { $sum: '$change' }
      }
    },
    {
      $project: {
        date: '$_id.date',
        operation: '$_id.operation',
        category: '$_id.category',
        totalChange: 1,
        _id: 0
      }
    },
    { $sort: { date: 1 } }
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