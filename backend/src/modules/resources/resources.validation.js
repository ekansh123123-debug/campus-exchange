import { z } from 'zod';
import { RESOURCE_TYPE_VALUES } from '../../constants/resource-status.js';

const FORBIDDEN_RESOURCE_KEYS = [
  'status',
  'uploaderId',
  'approvedBy',
  'reviewedBy',
  'resourceCode',
  'moderation',
  'downloadCount',
  'role',
];

export const createResourceBodySchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters.').max(160),
    description: z.string().trim().max(2000).optional().default(''),
    resourceType: z.enum(RESOURCE_TYPE_VALUES),
    branch: z.string().trim().min(1, 'Branch is required.').max(40),
    academicYear: z.string().trim().min(1, 'Academic year is required.').max(10),
    semester: z.string().trim().max(10).optional().default(''),
    subject: z.string().trim().min(2, 'Subject is required.').max(120),
    examYear: z.string().trim().max(20).optional().default(''),
    copyrightAttested: z
      .union([z.boolean(), z.string()])
      .optional()
      .transform((v) => v === undefined || v === true || v === 'true' || v === '1'),
  })
  .passthrough()
  .superRefine((val, ctx) => {
    for (const key of FORBIDDEN_RESOURCE_KEYS) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `Field "${key}" is server-controlled and cannot be set by the client.`,
        });
      }
    }
    if (val.copyrightAttested === false) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['copyrightAttested'],
        message: 'You must attest that this study material does not violate copyright policy.',
      });
    }
  });

export const searchResourcesQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  branch: z.string().trim().max(40).optional(),
  year: z.string().trim().max(10).optional(),
  academicYear: z.string().trim().max(10).optional(),
  semester: z.string().trim().max(10).optional(),
  subject: z.string().trim().max(120).optional(),
  resourceType: z.enum(RESOURCE_TYPE_VALUES).optional(),
  examYear: z.string().trim().max(20).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const resourceCodeParamSchema = z.object({
  resourceCode: z.string().trim().min(4).max(40),
});
