const { Resend } = require('resend');
const config = require('../config/config');
const logger = require('../config/logger');

// Initialize Resend
const resend = new Resend(config.email.resend.apiKey);

/**
 * Send email using Resend
 * @param {string} to
 * @param {string} subject
 * @param {string} html
 * @returns {Promise}
 */
const sendEmail = async (to, subject, html) => {
  try {
    const data = await resend.emails.send({
      from: `RasReserve <${config.email.from}>`,
      to: [to],
      subject: subject,
      html: html,
    });

    logger.info(`Email sent to ${to}: ${data.id}`);
    return data;
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error.message);
    throw error;
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
    const subject = 'Reset Your Password';
    const resetPasswordUrl = `https://rasreserve.site/reset-password?token=${token}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Dear user,</p>
        <p>We received a request to reset your password. Click the button below to proceed:</p>
        <a href="${resetPasswordUrl}" 
           style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Reset Password
        </a>
        <p>If you didn't request this, please ignore this email. This link will expire in 10 minutes.</p>
        <p>Best regards,<br>RasReserve Team</p>
      </div>
    `;
    await sendEmail(to, subject, html);
    logger.info(`Reset password email sent to ${to}`);
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
    const subject = 'Verify Your Email Address';
    const verificationEmailUrl = `https://rasreserve.site/verify-email?token=${token}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Welcome to RasReserve</h2>
        <p>Dear user,</p>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <a href="${verificationEmailUrl}" 
           style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Verify Email
        </a>
        <p>If you didn't create an account, please ignore this email.</p>
        <p>Best regards,<br>RasReserve Team</p>
      </div>
    `;
    await sendEmail(to, subject, html);
    logger.info(`Verification email sent to ${to}`);
  } catch (error) {
    logger.error(`Failed to send verification email to ${to}:`, error.message);
    throw error;
  }
};


module.exports = {
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
};