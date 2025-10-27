const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { serviceService } = require('../services');

const createService = catchAsync(async (req, res) => {
  const service = await serviceService.createService(req.body);
  res.status(httpStatus.CREATED).send(service);
});

const getServices = catchAsync(async (req, res) => {
  const filter = {
    title: req.query.title,
    category: req.query.category,
  };

  Object.keys(filter).forEach((key) => {
    if (filter[key] === undefined) {
      delete filter[key];
    }
  });

  const options = {
    sortBy: req.query.sortBy,
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 100,
  };

  const services = await serviceService.getServices(filter, options);
  res.status(httpStatus.OK).send(services);
});

const getService = catchAsync(async (req, res) => {
  const service = await serviceService.getServiceById(req.params.serviceId);
  if (!service) {
    return res.status(httpStatus.NOT_FOUND).send({ 
      message: 'Service not found' 
    });
  }
  res.status(httpStatus.OK).send(service);
});

const updateService = catchAsync(async (req, res) => {
  const service = await serviceService.updateServiceById(req.params.serviceId, req.body);
  res.status(httpStatus.OK).send(service);
});

const deleteService = catchAsync(async (req, res) => {
  await serviceService.deleteServiceById(req.params.serviceId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
};
