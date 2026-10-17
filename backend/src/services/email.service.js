import { env } from '../config/env.js';
import { getMailTransporter } from '../config/mail.js';
import { logger } from '../config/logger.js';

const devOutbox = new Map();

export function getDevMailForRecipient(email) {
  return devOutbox.get(String(email).toLowerCase().trim()) || null;
}

export function clearDevOutbox() {
  devOutbox.clear();
}

export async function sendVerificationEmail({ toEmail, fullName, otpCode }) {
  const normalized = String(toEmail).toLowerCase().trim();
  const subject = 'CampusExchange — Verify your college email';
  const text = `Hello ${fullName},\n\nYour CampusExchange verification code is: ${otpCode}\nThis code expires in ${env.otpExpiryMinutes} minutes.\n\nIf you did not register for CampusExchange, please ignore this message.`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; border: 1px solid #e7e5e4; border-radius: 12px; background-color: #ffffff; color: #1c1917;">
      <div style="margin-bottom: 20px;">
        <span style="font-size: 13px; font-weight: 700; letter-spacing: 1px; color: #cc785c; text-transform: uppercase;">CampusExchange</span>
      </div>
      <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 12px; color: #1c1917;">Verify your campus account</h2>
      <p style="font-size: 15px; line-height: 1.5; color: #44403c; margin: 0 0 20px;">
        Hello <strong>${fullName}</strong>,<br>
        Use the following 6-digit verification code to complete your registration:
      </p>
      <div style="background-color: #fafaf9; border: 1.5px dashed #cc785c; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
        <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #cc785c; font-family: monospace;">${otpCode}</span>
      </div>
      <p style="font-size: 13px; color: #78716c; line-height: 1.4; margin: 20px 0 0;">
        This code will expire in <strong>${env.otpExpiryMinutes} minutes</strong>. If you did not request this verification, please safely disregard this email.
      </p>
    </div>
  `;

  devOutbox.set(normalized, {
    purpose: 'email_verification',
    code: otpCode,
    sentAt: new Date().toISOString(),
  });

  const transporter = getMailTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: env.emailFrom,
        to: normalized,
        subject,
        text,
        html,
      });
      logger.info({ event: 'email_sent', purpose: 'email_verification', recipient: normalized }, 'Verification email dispatched');
    } catch (err) {
      logger.error(
        { event: 'smtp_delivery_failed', purpose: 'email_verification', reason: err.message },
        'SMTP delivery failed; verification code remains available in fallback outbox'
      );
    }
  } else {
    logger.info(
      { event: 'dev_mail_sink', purpose: 'email_verification' },
      'Verification email captured by fallback mail sink (SMTP inactive)'
    );
  }
}

export async function sendPasswordResetEmail({ toEmail, fullName, resetToken }) {
  const normalized = String(toEmail).toLowerCase().trim();
  const subject = 'CampusExchange — Password reset request';
  const text = `Hello ${fullName},\n\nYour CampusExchange password reset token is: ${resetToken}\nThis token expires in ${env.otpExpiryMinutes} minutes.\n\nIf you did not request a password reset, no action is needed.`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; border: 1px solid #e7e5e4; border-radius: 12px; background-color: #ffffff; color: #1c1917;">
      <div style="margin-bottom: 20px;">
        <span style="font-size: 13px; font-weight: 700; letter-spacing: 1px; color: #cc785c; text-transform: uppercase;">CampusExchange</span>
      </div>
      <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 12px; color: #1c1917;">Password Reset Request</h2>
      <p style="font-size: 15px; line-height: 1.5; color: #44403c; margin: 0 0 20px;">
        Hello <strong>${fullName}</strong>,<br>
        Your CampusExchange password reset token is:
      </p>
      <div style="background-color: #fafaf9; border: 1.5px dashed #cc785c; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
        <span style="font-size: 24px; font-weight: 800; letter-spacing: 3px; color: #cc785c; font-family: monospace;">${resetToken}</span>
      </div>
      <p style="font-size: 13px; color: #78716c; line-height: 1.4; margin: 20px 0 0;">
        This token expires in <strong>${env.otpExpiryMinutes} minutes</strong>. If you did not request a password reset, no action is needed.
      </p>
    </div>
  `;

  devOutbox.set(normalized, {
    purpose: 'password_reset',
    code: resetToken,
    sentAt: new Date().toISOString(),
  });

  const transporter = getMailTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: env.emailFrom,
        to: normalized,
        subject,
        text,
        html,
      });
      logger.info({ event: 'email_sent', purpose: 'password_reset', recipient: normalized }, 'Password reset email dispatched');
    } catch (err) {
      logger.error(
        { event: 'smtp_delivery_failed', purpose: 'password_reset', reason: err.message },
        'Password reset SMTP delivery failed; token remains available in fallback outbox'
      );
    }
  } else {
    logger.info(
      { event: 'dev_mail_sink', purpose: 'password_reset' },
      'Password reset email captured by fallback mail sink (SMTP inactive)'
    );
  }
}
