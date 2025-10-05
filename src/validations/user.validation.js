const Joi = require('joi');
const { password, objectId } = require('./custom.validation');

const createUser = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    contactNumber: Joi.string().required(),
    role: Joi.string().valid('user', 'admin', 'staff').default('user'),
    title: Joi.string().optional(),
    image: Joi.string().optional().uri(),
    selectedUserId: Joi.string().optional(),
    emailNotificationsEnabled: Joi.boolean().optional(),
  }),
};

const getUsers = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      password: Joi.string().custom(password),
      firstName: Joi.string(),
      lastName: Joi.string(),
      contactNumber: Joi.string(),
      role: Joi.string().valid('user', 'admin', 'staff'),
      title: Joi.string(),
      image: Joi.string().uri(),
      selectedUserId: Joi.string(),
      emailNotificationsEnabled: Joi.boolean(),
    })
    .min(1),
};

const changePassword = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().required().custom(password),
  }),
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  changePassword,
  deleteUser,
};