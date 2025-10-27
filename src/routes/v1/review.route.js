const express = require('express');
const validate = require('../../middlewares/validate');
const reviewController = require('../../controllers/review.controller');
const reviewValidation = require('../../validations/review.validation');

const router = express.Router();

router
  .route('/')
  .post(validate(reviewValidation.createReview), reviewController.createReview)
  .get(validate(reviewValidation.getReviews), reviewController.getReviews);

router
  .route('/:reviewId')
  .get(validate(reviewValidation.getReview), reviewController.getReview)
  .patch(validate(reviewValidation.updateReview), reviewController.updateReview)
  .delete(validate(reviewValidation.deleteReview), reviewController.deleteReview);

module.exports = router;
