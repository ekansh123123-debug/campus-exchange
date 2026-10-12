import { z } from 'zod';

const FORBIDDEN_CHAT_KEYS = ['senderId', 'buyerId', 'sellerId', 'conversationCode', 'role'];

function rejectForbiddenChatKeys(val, ctx) {
  if (!val || typeof val !== 'object') return;
  for (const key of FORBIDDEN_CHAT_KEYS) {
    if (Object.prototype.hasOwnProperty.call(val, key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: `Field "${key}" cannot be supplied by the client.`,
      });
    }
  }
}

export const openConversationBodySchema = z
  .object({
    listingCode: z.string().trim().min(4).max(40),
    initialMessage: z.string().trim().min(1).max(2000).optional(),
  })
  .passthrough()
  .superRefine(rejectForbiddenChatKeys);

export const sendMessageBodySchema = z
  .object({
    body: z
      .string()
      .trim()
      .min(1, 'Message cannot be empty.')
      .max(2000, 'Message cannot exceed 2000 characters.'),
  })
  .passthrough()
  .superRefine(rejectForbiddenChatKeys);

export const conversationCodeParamSchema = z.object({
  conversationCode: z.string().trim().min(4).max(40),
});
