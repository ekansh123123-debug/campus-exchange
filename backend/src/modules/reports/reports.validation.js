import { z } from 'zod';
import { REPORT_TARGET_TYPE_VALUES } from '../../constants/upload-limits.js';

const FORBIDDEN_REPORT_KEYS = [
  'reporterId',
  'status',
  'assignedAdminId',
  'resolvedByAdminId',
  'resolvedAt',
  'resolutionNote',
  'reportCode',
];

export const createReportBodySchema = z
  .object({
    targetType: z.enum(REPORT_TARGET_TYPE_VALUES),
    targetCode: z.string().trim().min(4).max(40),
    reason: z
      .string()
      .trim()
      .min(3, 'Reason must be at least 3 characters.')
      .max(160),
    details: z.string().trim().max(1500).optional().default(''),
  })
  .passthrough()
  .superRefine((val, ctx) => {
    for (const key of FORBIDDEN_REPORT_KEYS) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `Field "${key}" is server-controlled and cannot be supplied by the client.`,
        });
      }
    }
  });
