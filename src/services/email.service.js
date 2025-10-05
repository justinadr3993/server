const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../config/logger');

// Create transporter with better configuration
const transport = nodemailer.createTransport({
  host: config.email.smtp.host,
  port: config.email.smtp.port,
  secure: false, // true for 465, false for other ports
  auth: {
    user: config.email.smtp.auth.user,
    pass: config.email.smtp.auth.pass,
  },
  tls: {
    rejectUnauthorized: false // For self-signed certificates
  },
  connectionTimeout: 30000, // Increased timeout
  greetingTimeout: 30000,
  socketTimeout: 30000,
  pool: true,
  maxConnections: 5,
  maxMessages: 100
});

/* istanbul ignore next */
if (config.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch((error) => {
      logger.error('Unable to connect to email server:', error);
      logger.warn('Make sure you have configured the SMTP options in .env correctly');
    });
}

/**
 * Send email with better error handling
 * @param {string} to
 * @param {string} subject
 * @param {string} html
 * @returns {Promise}
 */
const sendEmail = async (to, subject, html) => {
  const msg = { 
    from: `"RasReserve" <${config.email.from}>`,
    to, 
    subject, 
    html 
  };
  
  logger.info(`Attempting to send email to: ${to}`);
  
  try {
    // Add timeout to email sending
    const emailPromise = transport.sendMail(msg);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Email sending timeout after 30 seconds')), 30000);
    });
    
    const result = await Promise.race([emailPromise, timeoutPromise]);
    logger.info(`Email sent successfully to: ${to}`);
    return result;
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error.message);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token) => {
  try {
    const subject = 'Reset Your Password - RasReserve';
    const resetPasswordUrl = `https://rasreserve.site/reset-password?token=${token}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; background-color: #4CAF50; padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">RasReserve</h1>
        </div>
        <div style="padding: 20px;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Dear user,</p>
          <p>We received a request to reset your password for your RasReserve account. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetPasswordUrl}" 
               style="display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4CAF50;">${resetPasswordUrl}</p>
          <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
          <p>This link will expire in 30 minutes for security reasons.</p>
          <p>Best regards,<br><strong>The RasReserve Team</strong></p>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-radius: 0 0 10px 10px;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;
    await sendEmail(to, subject, html);
    logger.info(`Reset password email sent successfully to ${to}`);
  } catch (error) {
    logger.error(`Failed to send reset password email to ${to}:`, error.message);
    throw error;
  }
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, token) => {
  try {
    const subject = 'Verify Your Email Address - RasReserve';
    const verificationEmailUrl = `https://rasreserve.site/verify-email?token=${token}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; background-color: #4CAF50; padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Welcome to RasReserve!</h1>
        </div>
        <div style="padding: 20px;">
          <h2 style="color: #333;">Email Verification Required</h2>
          <p>Dear user,</p>
          <p>Thank you for registering with RasReserve! To complete your registration and start using our services, please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationEmailUrl}" 
               style="display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4CAF50;">${verificationEmailUrl}</p>
          <p>If you didn't create an account with RasReserve, please ignore this email.</p>
          <p>Best regards,<br><strong>The RasReserve Team</strong></p>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-radius: 0 0 10px 10px;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;
    await sendEmail(to, subject, html);
    logger.info(`Verification email sent successfully to ${to}`);
  } catch (error) {
    logger.error(`Failed to send verification email to ${to}:`, error.message);
    throw error;
  }
};

module.exports = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
};