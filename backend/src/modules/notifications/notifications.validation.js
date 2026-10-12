import { z } from 'zod';

export const notificationCodeParamSchema = z.object({
  notificationCode: z.string().trim().min(4).max(40),
});
