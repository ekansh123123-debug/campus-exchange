import { z } from 'zod';
import { BRANCHES, ACADEMIC_YEARS } from '../../constants/academic.js';

export const updateProfileBodySchema = z
  .object({
    fullName: z.string().trim().min(2).max(100).optional(),
    branch: z.enum(BRANCHES).optional(),
    academicYear: z.enum(ACADEMIC_YEARS).optional(),
    bio: z.string().trim().max(500).optional(),
    avatarUrl: z.string().trim().max(500).optional(),
    contactPreferences: z
      .object({
        inAppChat: z.boolean().optional(),
        showBranchYear: z.boolean().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const userCodeParamSchema = z.object({
  userCode: z.string().trim().min(4).max(40),
});
