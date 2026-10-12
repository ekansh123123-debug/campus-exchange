import { z } from 'zod';
import { BRANCHES, ACADEMIC_YEARS } from '../../constants/academic.js';

export const registerBodySchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters.').max(100),
    collegeEmail: z.string().trim().email('Please provide a valid email address.').max(160),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .max(72, 'Password must not exceed 72 characters.'),
    branch: z.enum(BRANCHES).optional().default('GENERAL'),
    academicYear: z.enum(ACADEMIC_YEARS).optional().default('1'),
  })
  .strict();

export const verifyEmailBodySchema = z
  .object({
    collegeEmail: z.string().trim().email().max(160),
    otp: z
      .string()
      .trim()
      .regex(/^\d{6}$/, 'Verification code must be a 6-digit number.'),
  })
  .strict();

export const resendVerificationBodySchema = z
  .object({
    collegeEmail: z.string().trim().email().max(160),
  })
  .strict();

export const loginBodySchema = z
  .object({
    collegeEmail: z.string().trim().email('Please enter a valid college email.').max(160),
    password: z.string().min(1, 'Password is required.').max(128),
  })
  .strict();

export const forgotPasswordBodySchema = z
  .object({
    collegeEmail: z.string().trim().email().max(160),
  })
  .strict();

export const resetPasswordBodySchema = z
  .object({
    collegeEmail: z.string().trim().email().max(160),
    token: z.string().trim().min(6).max(128),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters.')
      .max(72, 'New password must not exceed 72 characters.'),
  })
  .strict();
