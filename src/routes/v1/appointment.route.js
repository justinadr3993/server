const express = require('express');
const validate = require('../../middlewares/validate');
const appointmentValidation = require('../../validations/appointment.validation');
const appointmentController = require('../../controllers/appointment.controller');

const router = express.Router();

router
  .route('/')
  .post(validate(appointmentValidation.createAppointment), appointmentController.createAppointment)
  .get(validate(appointmentValidation.getAppointments), appointmentController.getAppointments);

router
  .route('/:appointmentId')
  .get(appointmentController.getAppointment)
  .patch(validate(appointmentValidation.updateAppointment), appointmentController.updateAppointment)
  .delete(validate(appointmentValidation.deleteAppointment), appointmentController.deleteAppointment);

router
  .route('/:appointmentId/accept')
  .patch(appointmentController.acceptAppointment);

router
  .route('/:appointmentId/reject')
  .delete(appointmentController.rejectAppointment);

module.exports = router;