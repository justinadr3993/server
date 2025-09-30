const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { stockService } = require('../services');

const createStock = catchAsync(async (req, res) => {
  const stock = await stockService.createStock(req.body);
  res.status(httpStatus.CREATED).send(stock);
});

const getStocks = catchAsync(async (req, res) => {
  const stocks = await stockService.getStocks(req.query);
  res.status(httpStatus.OK).send(stocks);
});

const getStock = catchAsync(async (req, res) => {
  const stock = await stockService.getStockById(req.params.stockId);
  if (!stock) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Stock item not found');
  }
  res.status(httpStatus.OK).send(stock);
});

const updateStock = catchAsync(async (req, res) => {
  const stock = await stockService.updateStockById(req.params.stockId, req.body);
  res.status(httpStatus.OK).send(stock);
});

const deleteStock = catchAsync(async (req, res) => {
  await stockService.deleteStockById(req.params.stockId);
  res.status(httpStatus.NO_CONTENT).send();
});

const recordStockChange = catchAsync(async (req, res) => {
  const { change, operation } = req.body;
  const stock = await stockService.recordStockChange(req.params.stockId, change, operation);
  res.status(httpStatus.OK).send(stock);
});

const getStockAnalytics = catchAsync(async (req, res) => {
  const analytics = await stockService.getStockAnalytics();
  res.send(analytics);
});

const getStockHistory = catchAsync(async (req, res) => {
  const history = await stockService.getStockHistory(req.query.timeframe);
  res.send(history);
});

const getStockForecast = catchAsync(async (req, res) => {
  const forecast = await stockService.getStockForecast();
  res.send(forecast);
});

module.exports = {
  createStock,
  getStocks,
  getStock,
  updateStock,
  deleteStock,
  recordStockChange,
  getStockAnalytics,
  getStockHistory,
  getStockForecast
};