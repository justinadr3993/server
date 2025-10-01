const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createStock = {
  body: Joi.object().keys({
    type: Joi.string().required().trim(),
    category: Joi.string().valid('Oil', 'Tire', 'Brake', 'Filter', 'Battery').required(),
    price: Joi.number().required().positive(),
    quantity: Joi.number().min(0).default(0),
    minStockLevel: Joi.number().min(0).default(5)
  })
};

const getStockAnalytics = {
  query: Joi.object().keys({})
};

const getStockHistory = {
  query: Joi.object().keys({
    timeframe: Joi.string().valid('week', 'month', 'year').default('month')
  })
};

const getStockForecast = {
  query: Joi.object().keys({})
};

const recordStockChange = {
  params: Joi.object().keys({
    stockId: Joi.string().custom(objectId).required()
  }),
  body: Joi.object().keys({
    change: Joi.number().required(),
    operation: Joi.string().valid('restock', 'usage').required()
  })
};

const getStock = {
  params: Joi.object().keys({
    stockId: Joi.string().custom(objectId).required()
  })
};

const getStocks = {
  query: Joi.object().keys({
    type: Joi.string(),
    category: Joi.string().valid('Oil', 'Tire', 'Brake', 'Filter', 'Battery'),
    lowStock: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer()
  })
};

const updateStock = {
  params: Joi.object().keys({
    stockId: Joi.string().custom(objectId).required()
  }),
  body: Joi.object().keys({
    type: Joi.string().trim(),
    category: Joi.string().valid('Oil', 'Tire', 'Brake', 'Filter', 'Battery'),
    price: Joi.number().positive(),
    quantity: Joi.number().min(0),
    minStockLevel: Joi.number().min(0)
  }).min(1)
};

const deleteStock = {
  params: Joi.object().keys({
    stockId: Joi.string().custom(objectId)
  })
};

module.exports = {
  createStock,
  getStockAnalytics,
  getStockHistory,
  getStockForecast,
  recordStockChange,
  getStock,
  getStocks,
  updateStock,
  deleteStock
};