const express = require('express');
const validate = require('../../middlewares/validate');
const serviceCategoryController = require('../../controllers/serviceCategory.controller');
const serviceCategoryValidation = require('../../validations/serviceCategory.validation');

const router = express.Router();

router
  .route('/')
  .post(validate(serviceCategoryValidation.createServiceCategory), serviceCategoryController.createServiceCategory)
  .get(validate(serviceCategoryValidation.getServiceCategories), serviceCategoryController.getServiceCategories);

router
  .route('/:categoryId')
  .get(validate(serviceCategoryValidation.getServiceCategory), serviceCategoryController.getServiceCategory)
  .patch(validate(serviceCategoryValidation.updateServiceCategory), serviceCategoryController.updateServiceCategory)
  .delete(validate(serviceCategoryValidation.deleteServiceCategory), serviceCategoryController.deleteServiceCategory);

module.exports = router;