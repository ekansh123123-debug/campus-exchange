import { env } from '../config/env.js';
import { getMailTransporter } from '../config/mail.js';
import { logger } from '../config/logger.js';

const devOutbox = new Map();

export function getDevMailForRecipient(email) {
  if (env.isProd) return null;
  return devOutbox.get(String(email).toLowerCase().trim()) || null;
}

export function clearDevOutbox() {
  devOutbox.clear();
}

export async function sendVerificationEmail({ toEmail, fullName, otpCode }) {
  const normalized = String(toEmail).toLowerCase().trim();
  const subject = 'CampusExchange — Verify your college email';
  const text = `Hello ${fullName},\n\nYour CampusExchange verification code is: ${otpCode}\nThis code expires in ${env.otpExpiryMinutes} minutes.\n\nIf you did not register for CampusExchange, please ignore this message.`;

  if (!env.isProd) {
    devOutbox.set(normalized, {
      purpose: 'email_verification',
      code: otpCode,
      sentAt: new Date().toISOString(),
    });
  }

  const transporter = getMailTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: env.emailFrom,
        to: normalized,
        subject,
        text,
      });
    } catch (err) {
      if (env.isProd) throw err;
      logger.warn(
        { event: 'dev_mail_smtp_fallback', purpose: 'email_verification', reason: err.message },
        'SMTP delivery failed in development; verification code remains available in devOutbox'
      );
    }
  } else {
    logger.info(
      { event: 'dev_mail_sink', purpose: 'email_verification' },
      'Verification email captured by local development mail sink'
    );
  }
}

export async function sendPasswordResetEmail({ toEmail, fullName, resetToken }) {
  const normalized = String(toEmail).toLowerCase().trim();
  const subject = 'CampusExchange — Password reset request';
  const text = `Hello ${fullName},\n\nYour CampusExchange password reset token is: ${resetToken}\nThis token expires in ${env.otpExpiryMinutes} minutes.\n\nIf you did not request a password reset, no action is needed.`;

  if (!env.isProd) {
    devOutbox.set(normalized, {
      purpose: 'password_reset',
      code: resetToken,
      sentAt: new Date().toISOString(),
    });
  }

  const transporter = getMailTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: env.emailFrom,
        to: normalized,
        subject,
        text,
      });
    } catch (err) {
      if (env.isProd) throw err;
      logger.warn(
        { event: 'dev_mail_smtp_fallback', purpose: 'password_reset', reason: err.message },
        'SMTP delivery failed in development; reset token remains available in devOutbox'
      );
    }
  } else {
    logger.info(
      { event: 'dev_mail_sink', purpose: 'password_reset' },
      'Password reset email captured by local development mail sink'
    );
  }
}
