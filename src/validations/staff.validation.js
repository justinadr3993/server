const Joi = require('joi');

const assignStaff = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    image: Joi.string().uri().required(),
  }),
};

const updateStaff = {
  body: Joi.object().keys({
    title: Joi.string(),
    image: Joi.string().uri(),
  }),
};

module.exports = {
  assignStaff,
  updateStaff,
};