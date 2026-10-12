import { asyncHandler } from '../../utils/async-handler.js';
import { sendPaginated, sendSuccess } from '../../utils/api-response.js';
import {
  getConversationDetail,
  listConversationMessages,
  listMyConversations,
  markConversationMessagesRead,
  openOrCreateConversation,
  sendMessageInConversation,
} from './conversations.service.js';

export const listConversationsController = asyncHandler(async (req, res) => {
  const result = await listMyConversations(req.user, req.query);
  return sendPaginated(res, result.items, result.meta, 200);
});

export const openConversationController = asyncHandler(async (req, res) => {
  const result = await openOrCreateConversation({
    actor: req.user,
    listingCode: req.validatedBody.listingCode,
    initialMessage: req.validatedBody.initialMessage,
  });
  return sendSuccess(res, result, 201);
});

export const getConversationController = asyncHandler(async (req, res) => {
  const conversation = await getConversationDetail(
    req.user,
    req.validatedParams.conversationCode
  );
  return sendSuccess(res, { conversation }, 200);
});

export const listMessagesController = asyncHandler(async (req, res) => {
  const result = await listConversationMessages(
    req.user,
    req.validatedParams.conversationCode,
    req.query
  );
  return res.status(200).json({
    success: true,
    data: result.items,
    conversation: result.conversation,
    meta: {
      page: result.meta.page,
      limit: result.meta.limit,
      total: result.meta.total,
      totalPages: Math.max(1, Math.ceil(result.meta.total / result.meta.limit)),
    },
  });
});

export const sendMessageController = asyncHandler(async (req, res) => {
  const message = await sendMessageInConversation({
    actor: req.user,
    conversationCode: req.validatedParams.conversationCode,
    body: req.validatedBody.body,
  });
  return sendSuccess(res, { message }, 201);
});

export const markConversationReadController = asyncHandler(async (req, res) => {
  const result = await markConversationMessagesRead(
    req.user,
    req.validatedParams.conversationCode
  );
  return sendSuccess(res, result, 200);
});
