import nodemailer from 'nodemailer';
import { env } from './env.js';

let mailTransporter = null;

export function isSmtpConfigured() {
  if (!env.smtpHost) return false;
  const host = String(env.smtpHost).trim().toLowerCase();
  if (
    !host ||
    host === 'smtp.example.com' ||
    host.includes('example.com') ||
    host === 'localhost' ||
    host === '127.0.0.1'
  ) {
    return false;
  }
  return true;
}

export function getMailTransporter() {
  if (env.isTest) return null;
  if (mailTransporter) return mailTransporter;
  if (isSmtpConfigured()) {
    mailTransporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 8000,
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
