const express = require('express');
const validate = require('../../middlewares/validate');
const stockController = require('../../controllers/stock.controller');
const stockValidation = require('../../validations/stock.validation');

const router = express.Router();

router.route('/')
  .get(validate(stockValidation.getStocks), stockController.getStocks)
  .post(validate(stockValidation.createStock), stockController.createStock);

router.get('/analytics', stockController.getStockAnalytics);
router.get('/history', validate(stockValidation.getStockHistory), stockController.getStockHistory);
router.get('/forecast', stockController.getStockForecast);

router.route('/:stockId/change')
  .post(validate(stockValidation.recordStockChange), stockController.recordStockChange);

router.route('/:stockId')
  .get(validate(stockValidation.getStock), stockController.getStock)
  .patch(validate(stockValidation.updateStock), stockController.updateStock)
  .delete(validate(stockValidation.deleteStock), stockController.deleteStock);

module.exports = router;