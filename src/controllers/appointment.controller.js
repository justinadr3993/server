const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { appointmentService, userService, serviceService } = require('../services');

const createAppointment = catchAsync(async (req, res) => {
  try {
    await userService.getUserById(req.body.userId);
  } catch (error) {
    if (error.statusCode === httpStatus.NOT_FOUND) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid user specified');
    }
    throw error;
  }

  // Check if appointment time is already booked for this service category
  const existingAppointment = await appointmentService.getAppointmentByCategoryAndTime(
    req.body.serviceCategory,
    req.body.appointmentDateTime
  );
  
  if (existingAppointment) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'This time slot is already booked for the selected service category'
    );
  }

  const appointment = await appointmentService.createAppointment(req.body);
  
  const serviceDetails = await serviceService.getServiceById(appointment.serviceType)
    .catch(() => null);

  res.status(httpStatus.CREATED).send(appointment);
});


const getAppointments = catchAsync(async (req, res) => {
  const filter = {
    userId: req.query.userId,
    serviceCategory: req.query.serviceCategory,
    serviceType: req.query.serviceType,
    status: req.query.status,
  };

  Object.keys(filter).forEach((key) => {
    if (filter[key] === undefined) {
      delete filter[key];
    }
  });

  const options = {
    sortBy: req.query.sortBy,
    populate: req.query.populate,
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 10,
  };

  const result = await appointmentService.queryAppointments(filter, options);
  res.send(result);
});

const getAppointment = catchAsync(async (req, res) => {
  const appointment = await appointmentService.getAppointmentById(req.params.appointmentId);
  if (!appointment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Appointment not found');
  }
  res.send(appointment);
});

const updateAppointment = catchAsync(async (req, res) => {
  const appointment = await appointmentService.getAppointmentById(req.params.appointmentId);
  if (!appointment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Appointment not found');
  }

  // Check if date/time is being changed for an upcoming appointment
  if (req.body.appointmentDateTime && 
      new Date(req.body.appointmentDateTime).getTime() !== appointment.appointmentDateTime.getTime() &&
      appointment.status === 'Upcoming') {
    req.body.status = 'Rescheduled';
  }
  
  if (req.body.status) {
    const validTransitions = {
      Upcoming: ['Completed', 'Cancelled', 'No Arrival', 'Rescheduled'],
      Rescheduled: ['Completed', 'Cancelled', 'No Arrival'],
      Completed: [],
      Cancelled: [],
      'No Arrival': []
    };

    if (!validTransitions[appointment.status].includes(req.body.status)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Invalid status transition from ${appointment.status} to ${req.body.status}`
      );
    }
  }

  Object.assign(appointment, req.body);
  await appointment.save();

  res.send(appointment);
});

const deleteAppointment = catchAsync(async (req, res) => {
  await appointmentService.deleteAppointmentById(req.params.appointmentId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createAppointment,
  getAppointments,
  getAppointment,
  updateAppointment,
  deleteAppointment,
};