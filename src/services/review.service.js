const { Review } = require('../models');

const createReview = async (reviewBody) => {
  return Review.create(reviewBody);
};

const getReviews = async (filter, options) => {
  return Review.paginate(filter, options);
};

const getReviewById = async (id) => {
  return Review.findById(id).populate('userId serviceType appointmentId');
};

const updateReviewById = async (reviewId, updateBody) => {
  const review = await getReviewById(reviewId);
  if (!review) {
    throw new Error('Review not found');
  }
  
  const allowedUpdates = ['rating', 'title', 'text'];
  const updatesToApply = {};
  
  allowedUpdates.forEach(field => {
    if (updateBody[field] !== undefined) {
      updatesToApply[field] = updateBody[field];
    }
  });

  Object.assign(review, updatesToApply);
  await review.save();
  return review;
};

const deleteReviewById = async (reviewId) => {
  const review = await getReviewById(reviewId);
  if (!review) {
    throw new Error('Review not found');
  }
  await review.remove();
  return review;
};

module.exports = {
  createReview,
  getReviews,
  getReviewById,
  updateReviewById,
  deleteReviewById,
};