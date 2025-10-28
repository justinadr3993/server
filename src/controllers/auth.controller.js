const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService } = require('../services');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  
  (async () => {
    try {
      const verifyEmailToken = await tokenService.generateVerifyEmailToken(user);
      logger.info(`Sending verification email to: ${user.email}`);
      await emailService.sendVerificationEmail(user.email, verifyEmailToken);
      logger.info('Verification email sent successfully');
    } catch (emailError) {
      logger.error('Failed to send verification email:', emailError);
    }
  })();
  
  res.status(httpStatus.CREATED).send({ 
    user, 
    tokens,
    message: 'Please check your email for verification link.'
  });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  
  if (!user.isEmailVerified) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please verify your email first');
  }
  
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  const { token, password } = req.body;
  
  if (!token) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Reset token is required');
  }
  
  if (!password) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Password is required');
  }
  
  await authService.resetPassword(token, password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  const token = req.body.token || req.query.token;
  
  if (!token) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Verification token is required');
  }
  
  await authService.verifyEmail(token);
  res.status(httpStatus.OK).send({ 
    message: 'Email verified successfully',
    verified: true 
  });
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
};