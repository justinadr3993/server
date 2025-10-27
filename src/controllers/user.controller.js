const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['email', 'role']);
  const options = {
    sortBy: req.query.sortBy,
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 100,
  };
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user.role === 'staff') {
    return res.send(user);
  }

  const requester = req.user || user;

  if (!requester) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized access');
  }

  if (requester.role !== 'admin' && requester.id !== req.params.userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  res.send(user);
});

const getStaffs = catchAsync(async (req, res) => {
  const result = await userService.queryUsers({ role: 'staff' }, {});
  res.send(result);
});

const changePassword = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { currentPassword, newPassword } = req.body;

  // Check if user is changing their own password or admin is changing it
  if (req.user.id !== userId && req.user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only change your own password');
  }

  const user = await userService.getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const isMatch = await user.isPasswordMatch(currentPassword);
  if (!isMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Current password is incorrect');
  }

  await userService.updateUserPassword(userId, newPassword);

  res.status(httpStatus.OK).send({ message: 'Password changed successfully' });
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.send(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createUser,
  getUsers,
  getUser,
  getStaffs,
  changePassword,
  updateUser,
  deleteUser,
};