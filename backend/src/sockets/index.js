import { Server as SocketIOServer } from 'socket.io';
import { getCorsOptions } from '../config/cors.js';
import { logger } from '../config/logger.js';
import { sendMessageInConversation } from '../modules/conversations/conversations.service.js';
import { setSocketInstance } from '../services/notification.service.js';
import {
  authenticateSocketHandshake,
  authorizeConversationParticipant,
} from './authorization.js';

export function attachSocketServer(httpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: getCorsOptions(),
  });

  io.use(async (socket, next) => {
    try {
      const actor = await authenticateSocketHandshake(socket);
      socket.data.user = actor;
      return next();
    } catch (err) {
      return next(new Error(err.code || 'SOCKET_AUTH_FAILED'));
    }
  });

  io.on('connection', (socket) => {
    const actor = socket.data.user;
    socket.join(`user:${actor.id}`);

    socket.on('conversation:join', async (payload = {}, ack) => {
      try {
        const { conversationCode } = payload;
        const { conversation } = await authorizeConversationParticipant(
          actor._id,
          conversationCode
        );
        socket.join(`conversation:${conversation.conversationCode}`);
        if (typeof ack === 'function') {
          ack({ success: true, conversationCode: conversation.conversationCode });
        }
      } catch (err) {
        if (typeof ack === 'function') {
          ack({
            success: false,
            error: { code: err.code || 'FORBIDDEN', message: err.message },
          });
        }
      }
    });

    socket.on('message:send', async (payload = {}, ack) => {
      try {
        const { conversationCode, body } = payload;
        if (!body || typeof body !== 'string' || !body.trim() || body.trim().length > 2000) {
          throw new Error('Message body must be 1 to 2000 characters.');
        }
        const { user } = await authorizeConversationParticipant(actor._id, conversationCode);
        const saved = await sendMessageInConversation({
          actor: user,
          conversationCode,
          body: body.trim(),
        });
        if (typeof ack === 'function') {
          ack({ success: true, data: { message: saved } });
        }
      } catch (err) {
        logger.warn({ event: 'socket_message_rejected', reason: err.message });
        if (typeof ack === 'function') {
          ack({
            success: false,
            error: { code: err.code || 'MESSAGE_SEND_FAILED', message: err.message },
          });
        }
      }
    });
  });

  setSocketInstance(io);
  return io;
}
