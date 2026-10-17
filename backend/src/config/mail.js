import nodemailer from 'nodemailer';
import { env } from './env.js';

let mailTransporter = null;

export function isSmtpConfigured() {
  if (env.smtpService === 'gmail') return Boolean(env.smtpUser && env.smtpPass);
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
  return Boolean(env.smtpUser && env.smtpPass);
}

export function getMailTransporter() {
  if (env.isTest) return null;
  if (mailTransporter) return mailTransporter;
  if (isSmtpConfigured()) {
    const isGmail =
      env.smtpService === 'gmail' ||
      env.smtpHost.toLowerCase() === 'smtp.gmail.com' ||
      env.smtpUser.toLowerCase().endsWith('@gmail.com');

    const transportConfig = isGmail
      ? {
          service: 'gmail',
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
          auth: {
            user: env.smtpUser,
            pass: env.smtpPass,
          },
        }
      : {
          host: env.smtpHost,
          port: env.smtpPort,
          secure: env.smtpSecure || env.smtpPort === 465,
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
          auth: env.smtpUser
            ? {
                user: env.smtpUser,
                pass: env.smtpPass,
              }
            : undefined,
        };

    mailTransporter = nodemailer.createTransport(transportConfig);
  }
  return mailTransporter;
}
