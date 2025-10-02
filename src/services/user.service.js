const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');

const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  return User.create(userBody);
};

const queryUsers = async (filter, options) => {
  return User.paginate(filter, options);
};

const getUserById = async (id, requester = null) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid user ID format');
  }

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(
      httpStatus.NOT_FOUND, 
      `User not found with ID: ${id}`
    );
  }

  // Public access for staff profiles
  if (user.role === 'staff') {
    return user;
  }

  // Internal access allowed
  if (!requester) {
    return user;
  }

  // Restrict access for non-admin/non-owner
  if (requester.role !== 'admin' && String(user._id) !== String(requester.id)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  return user;
};

const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

const updateUserPassword = async (userId, newPassword) => {
  const user = await getUserById(userId);
  
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  user.password = newPassword;
  await user.save();
  
  return user;
};

const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  const updatedUser = { ...updateBody };

  // Handle role changes
  if (updatedUser.role === 'staff') {
    updatedUser.selectedUserId = userId;
  } else if (updatedUser.role === 'user') {
    updatedUser.selectedUserId = null;
    updatedUser.title = null;
    updatedUser.image = null;
  }

  Object.assign(user, updatedUser);
  await user.save();
  return user;
};

const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  await user.remove();
  return user;
};

module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserPassword,
  updateUserById,
  deleteUserById,
};