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
      });
      logger.info({ event: 'email_sent', purpose: 'email_verification' }, 'Verification email dispatched');
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
      });
      logger.info({ event: 'email_sent', purpose: 'password_reset' }, 'Password reset email dispatched');
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
