const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');

const assignStaff = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const staffData = req.body;

  const updatedUser = await userService.updateUserById(userId, {
    ...staffData,
    role: 'staff',
    selectedUserId: userId,
  });

  res.status(httpStatus.OK).send(updatedUser);
});

const updateStaff = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const staffData = req.body;

  const updatedUser = await userService.updateUserById(userId, staffData);

  res.status(httpStatus.OK).send(updatedUser);
});

const unassignStaff = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const updatedUser = await userService.updateUserById(userId, {
    role: 'user',
    title: '',
    image: '',
    selectedUserId: null,
  });

  res.status(httpStatus.OK).send(updatedUser);
});

module.exports = {
  assignStaff,
  updateStaff,
  unassignStaff,
};