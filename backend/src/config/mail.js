import nodemailer from 'nodemailer';
import { env } from './env.js';

let mailTransporter = null;

export function getMailTransporter() {
  if (env.isTest) return null;
  if (mailTransporter) return mailTransporter;
  if (env.smtpHost) {
    mailTransporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: env.smtpUser
        ? {
            user: env.smtpUser,
            pass: env.smtpPass,
          }
        : undefined,
    });
  }
  return mailTransporter;
}
