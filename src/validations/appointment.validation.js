const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createAppointment = {
  body: Joi.object().keys({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    contactNumber: Joi.string().required(),
    email: Joi.string().email().required(),
    serviceCategory: Joi.string().custom(objectId).required(),
    serviceType: Joi.string().custom(objectId).required(),
    additionalNotes: Joi.string().allow('').optional(),
    userId: Joi.string().custom(objectId).required(),
    appointmentDateTime: Joi.date().greater('now').required(),
    status: Joi.string().valid('Requested', 'Upcoming', 'Completed', 'Cancelled', 'No Arrival', 'Rescheduled').default('Requested'),
  }),
};

const updateAppointment = {
  params: Joi.object().keys({
    appointmentId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      firstName: Joi.string(),
      lastName: Joi.string(),
      contactNumber: Joi.string(),
      email: Joi.string().email(),
      serviceCategory: Joi.string().custom(objectId),
      serviceType: Joi.string().custom(objectId),
      additionalNotes: Joi.string().allow(''),
      userId: Joi.string().custom(objectId),
      appointmentDateTime: Joi.date(),
      status: Joi.string().valid('Requested', 'Upcoming', 'Completed', 'Cancelled', 'No Arrival', 'Rescheduled'),
    })
    .min(1),
};

const deleteAppointment = {
  params: Joi.object().keys({
    appointmentId: Joi.string().custom(objectId),
  }),
};

const getAppointments = {
  query: Joi.object().keys({
    serviceCategory: Joi.string().custom(objectId),
    serviceType: Joi.string().custom(objectId),
    userId: Joi.string().custom(objectId),
    status: Joi.string().valid('Requested', 'Upcoming', 'Completed', 'Cancelled', 'No Arrival', 'Rescheduled'),
    date: Joi.string(),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1),
  }),
};

module.exports = {
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointments,
};