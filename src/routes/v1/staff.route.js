const express = require('express');
const validate = require('../../middlewares/validate');
const staffValidation = require('../../validations/staff.validation');
const staffController = require('../../controllers/staff.controller');
const userController = require('../../controllers/user.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

router.route('/').get(userController.getStaffs);

router
  .route('/:userId/assign')
  .patch(auth('manageUsers'), validate(staffValidation.assignStaff), staffController.assignStaff);

router
  .route('/:userId/update')
  .patch(auth('manageUsers'), validate(staffValidation.updateStaff), staffController.updateStaff);

router.route('/:userId/unassign').patch(auth('manageUsers'), staffController.unassignStaff);

module.exports = router;
