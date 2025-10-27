const express = require('express');
const appointmentRoute = require('./appointment.route');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const staffRoute = require('./staff.route');
const serviceRoute = require('./service.route'); 
const serviceCategoryRoute = require('./serviceCategory.route');
const reviewRoute = require('./review.route');
const healthController = require('../../controllers/health.controller');
const stockRoute = require('./stock.route');
const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/staffs',
    route: staffRoute,
  },
  {
    path: '/services',
    route: serviceRoute,
  },
  {
    path: '/service-categories',
    route: serviceCategoryRoute,
  },
  {
    path: '/appointments',
    route: appointmentRoute,
  },
  {
    path: '/reviews',
    route: reviewRoute,
  },
  {
    path: '/stocks',
    route: stockRoute,
  },
  {
    path: '/health',
    route: healthController.healthCheck,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});


module.exports = router;
