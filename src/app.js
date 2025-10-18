const express = require('express');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const cors = require('cors');
const passport = require('passport');
const httpStatus = require('http-status');
const config = require('./config/config');
const morgan = require('./config/morgan');
const { jwtStrategy } = require('./config/passport');
const { authLimiter } = require('./middlewares/rateLimiter');
const routes = require('./routes/v1');
const { errorConverter, errorHandler } = require('./middlewares/error');
const ApiError = require('./utils/ApiError');

const app = express();

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());
app.use(mongoSanitize());

// gzip compression
app.use(compression());

// enable cors with proper configuration
const corsOptions = {
  origin: function (origin, callback) {
    // List of allowed origins
    const allowedOrigins = [
      'https://rasreserve.site',
      'http://rasreserve.site',
      'https://www.rasreserve.site',
      'https://35.240.231.28',
      'http://35.240.231.28',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://localhost:8080',
      'https://localhost:3000'
    ];
    
    // Allow requests with no origin (like mobile apps, postman, or server-to-server calls)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Add CORS logging middleware for debugging
app.use((req, res, next) => {
  console.log('Incoming request:', {
    method: req.method,
    origin: req.headers.origin,
    url: req.url,
    'user-agent': req.headers['user-agent']
  });
  next();
});

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
  app.use('/v1/auth', authLimiter);
}

// v1 api routes
app.use('/v1', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.env,
    port: config.port
  });
});

// CORS test endpoint
app.get('/cors-test', (req, res) => {
  res.json({
    message: 'CORS is working correctly!',
    allowedOrigins: [
      'https://rasreserve.site',
      'https://35.240.231.28',
      'http://localhost:3000'
    ],
    requestOrigin: req.headers.origin,
    timestamp: new Date().toISOString(),
    environment: config.env
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Your server API is running! Use /v1 for endpoints.',
    health: '/health',
    corsTest: '/cors-test',
    environment: config.env
  });
});

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

module.exports = app;