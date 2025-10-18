const https = require('https');
const fs = require('fs');
const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');

let server;

// SSL certificate options
const sslOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/rasreserve.site/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/rasreserve.site/fullchain.pem')
};

mongoose.connect(config.mongoose.url, config.mongoose.options)
  .then(() => {
    logger.info('Connected to MongoDB Atlas');
    
    // Create HTTPS server on port 443
    server = https.createServer(sslOptions, app).listen(443, () => {
      logger.info(`HTTPS Server running on port 443 - https://rasreserve.site`);
    });
  })
  .catch((err) => {
    logger.error('MongoDB Atlas connection error:', err);
    process.exit(1);
  });

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});