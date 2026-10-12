import { ACCOUNT_STATUS } from '../constants/account-status.js';
import { Conversation } from '../models/Conversation.model.js';
import { User } from '../models/User.model.js';
import { verifyAccessToken } from '../services/token.service.js';
import { AppError } from '../utils/app-error.js';

export async function authenticateSocketHandshake(socket) {
  const rawToken =
    socket.handshake.auth?.token ||
    (typeof socket.handshake.headers?.authorization === 'string' &&
    socket.handshake.headers.authorization.startsWith('Bearer ')
      ? socket.handshake.headers.authorization.slice(7).trim()
      : '');

  if (!rawToken) {
    throw new AppError(401, 'SOCKET_UNAUTHORIZED', 'Missing socket authentication token.');
  }

  const decoded = verifyAccessToken(rawToken);
  const user = await User.findById(decoded.sub);

  if (!user || user.accountStatus !== ACCOUNT_STATUS.ACTIVE || !user.emailVerifiedAt) {
    throw new AppError(
      403,
      'SOCKET_FORBIDDEN',
      'Only active, email-verified accounts can connect to realtime channels.'
    );
  }

  return {
    _id: user._id,
    id: String(user._id),
    userCode: user.userCode,
    fullName: user.fullName,
    role: user.role,
    accountStatus: user.accountStatus,
    emailVerifiedAt: user.emailVerifiedAt,
  };
}

export async function authorizeConversationParticipant(actorId, conversationCode) {
  const currentUser = await User.findById(actorId);
  if (
    !currentUser ||
    currentUser.accountStatus !== ACCOUNT_STATUS.ACTIVE ||
    !currentUser.emailVerifiedAt
  ) {
    throw new AppError(403, 'ACCOUNT_BLOCKED', 'Account is no longer active.');
  }

  const conv = await Conversation.findOne({
    conversationCode: String(conversationCode || '').trim(),
    $or: [{ buyerId: actorId }, { sellerId: actorId }],
  });

  if (!conv) {
    throw new AppError(403, 'FORBIDDEN_CONVERSATION', 'Not authorized for this conversation.');
  }

  return { user: currentUser, conversation: conv };
}
