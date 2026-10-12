import { LISTING_STATUS } from '../../constants/listing-status.js';
import { Conversation } from '../../models/Conversation.model.js';
import { Listing } from '../../models/Listing.model.js';
import { Message } from '../../models/Message.model.js';
import {
  generateUniquePublicCode,
  PUBLIC_ID_PREFIXES,
} from '../../services/public-id.service.js';
import {
  createNotification,
  getSocketInstance,
} from '../../services/notification.service.js';
import { AppError } from '../../utils/app-error.js';
import { parsePagination } from '../../utils/pagination.js';
import { toSafePublicUser } from '../../utils/safe-user.js';

export function toConversationDto(convDoc, actorId) {
  const c = typeof convDoc.toObject === 'function' ? convDoc.toObject() : convDoc;
  const actorIdStr = String(actorId);
  const buyerIdStr = String(c.buyerId?._id || c.buyerId);
  const isBuyer = actorIdStr === buyerIdStr;
  const otherParticipantDoc = isBuyer ? c.sellerId : c.buyerId;

  return {
    conversationCode: c.conversationCode,
    viewerRole: isBuyer ? 'buyer' : 'seller',
    listing:
      c.listingId && typeof c.listingId === 'object' && c.listingId.listingCode
        ? {
            listingCode: c.listingId.listingCode,
            title: c.listingId.title,
            pricePaise: c.listingId.pricePaise,
            priceInr: Number((c.listingId.pricePaise / 100).toFixed(2)),
            listingType: c.listingId.listingType,
            status: c.listingId.status,
            thumbnailUrl:
              c.listingId.images?.[0]?.thumbnailUrl || c.listingId.images?.[0]?.url || '',
          }
        : null,
    buyer:
      c.buyerId && typeof c.buyerId === 'object' && c.buyerId.userCode
        ? toSafePublicUser(c.buyerId)
        : null,
    seller:
      c.sellerId && typeof c.sellerId === 'object' && c.sellerId.userCode
        ? toSafePublicUser(c.sellerId)
        : null,
    otherParticipant:
      otherParticipantDoc &&
      typeof otherParticipantDoc === 'object' &&
      otherParticipantDoc.userCode
        ? toSafePublicUser(otherParticipantDoc)
        : null,
    lastMessageAt: c.lastMessageAt ? new Date(c.lastMessageAt).toISOString() : null,
    lastMessagePreview: c.lastMessagePreview || '',
    isClosed: Boolean(c.isClosed),
    createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : null,
  };
}

export function toMessageDto(msgDoc, actorId) {
  const m = typeof msgDoc.toObject === 'function' ? msgDoc.toObject() : msgDoc;
  const senderIdStr = String(m.senderId?._id || m.senderId);
  const actorIdStr = actorId ? String(actorId) : '';
  return {
    id: String(m._id || m.id),
    body: m.body,
    isMine: Boolean(actorIdStr && senderIdStr === actorIdStr),
    sender:
      m.senderId && typeof m.senderId === 'object' && m.senderId.userCode
        ? toSafePublicUser(m.senderId)
        : null,
    isRead: Boolean(m.readAt) || (m.readBy || []).some((id) => String(id) === actorIdStr),
    readAt: m.readAt ? new Date(m.readAt).toISOString() : null,
    createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : null,
  };
}

async function getScopedConversationOrThrow(conversationCode, actorId) {
  const conv = await Conversation.findOne({
    conversationCode,
    $or: [{ buyerId: actorId }, { sellerId: actorId }],
  }).populate(['listingId', 'buyerId', 'sellerId']);

  if (!conv) {
    throw new AppError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found.');
  }
  return conv;
}

export async function openOrCreateConversation({
  actor,
  listingCode,
  initialMessage,
}) {
  const listing = await Listing.findOne({ listingCode });
  if (!listing) {
    throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing not found.');
  }

  if (String(listing.sellerId) === String(actor._id)) {
    throw new AppError(
      400,
      'SELF_CONVERSATION_FORBIDDEN',
      'You cannot start a conversation with yourself on your own listing.'
    );
  }

  let conv = await Conversation.findOne({
    listingId: listing._id,
    buyerId: actor._id,
    sellerId: listing.sellerId,
  }).populate(['listingId', 'buyerId', 'sellerId']);

  if (!conv) {
    if (![LISTING_STATUS.ACTIVE, LISTING_STATUS.RESERVED].includes(listing.status)) {
      throw new AppError(
        409,
        'LISTING_NOT_AVAILABLE_FOR_CHAT',
        'New conversations can only be started on active listings.'
      );
    }

    const conversationCode = await generateUniquePublicCode(
      Conversation,
      'conversationCode',
      PUBLIC_ID_PREFIXES.CONVERSATION
    );

    try {
      conv = await Conversation.create({
        conversationCode,
        listingId: listing._id,
        buyerId: actor._id,
        sellerId: listing.sellerId,
        lastMessageAt: new Date(),
        lastMessagePreview: '',
      });
      await conv.populate(['listingId', 'buyerId', 'sellerId']);
    } catch (err) {
      if (err && err.code === 11000) {
        conv = await Conversation.findOne({
          listingId: listing._id,
          buyerId: actor._id,
          sellerId: listing.sellerId,
        }).populate(['listingId', 'buyerId', 'sellerId']);
      } else {
        throw err;
      }
    }
  }

  let sentMessage = null;
  if (initialMessage && String(initialMessage).trim()) {
    sentMessage = await sendMessageInConversation({
      actor,
      conversationCode: conv.conversationCode,
      body: initialMessage,
    });
    conv = await getScopedConversationOrThrow(conv.conversationCode, actor._id);
  }

  return {
    conversation: toConversationDto(conv, actor._id),
    initialMessage: sentMessage,
  };
}

export async function listMyConversations(actor, query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {
    $or: [{ buyerId: actor._id }, { sellerId: actor._id }],
  };

  const [rows, total] = await Promise.all([
    Conversation.find(filter)
      .sort({ lastMessageAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate(['listingId', 'buyerId', 'sellerId']),
    Conversation.countDocuments(filter),
  ]);

  return {
    items: rows.map((row) => toConversationDto(row, actor._id)),
    meta: { page, limit, total },
  };
}

export async function getConversationDetail(actor, conversationCode) {
  const conv = await getScopedConversationOrThrow(conversationCode, actor._id);
  return toConversationDto(conv, actor._id);
}

export async function listConversationMessages(actor, conversationCode, query = {}) {
  const conv = await getScopedConversationOrThrow(conversationCode, actor._id);
  const { page, limit, skip } = parsePagination(query);

  const filter = { conversationId: conv._id };
  const [rows, total] = await Promise.all([
    Message.find(filter)
      .sort({ createdAt: 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId'),
    Message.countDocuments(filter),
  ]);

  return {
    conversation: toConversationDto(conv, actor._id),
    items: rows.map((row) => toMessageDto(row, actor._id)),
    meta: { page, limit, total },
  };
}

export async function sendMessageInConversation({
  actor,
  conversationCode,
  body,
}) {
  const conv = await getScopedConversationOrThrow(conversationCode, actor._id);
  if (conv.isClosed) {
    throw new AppError(409, 'CONVERSATION_CLOSED', 'This conversation has been closed.');
  }

  const trimmedBody = String(body || '').trim();
  const messageDoc = await Message.create({
    conversationId: conv._id,
    senderId: actor._id,
    body: trimmedBody,
    readBy: [actor._id],
  });

  await messageDoc.populate('senderId');

  conv.lastMessageAt = messageDoc.createdAt;
  conv.lastMessagePreview = trimmedBody.slice(0, 160);
  await conv.save();

  const buyerIdStr = String(conv.buyerId?._id || conv.buyerId);
  const sellerIdStr = String(conv.sellerId?._id || conv.sellerId);
  const recipientId =
    String(actor._id) === buyerIdStr ? conv.sellerId?._id || conv.sellerId : conv.buyerId?._id || conv.buyerId;

  const listingTitle = conv.listingId?.title || 'CampusExchange item';
  await createNotification({
    userId: recipientId,
    eventType: 'new_message',
    title: `New Message from ${actor.fullName}`,
    body: `Regarding "${listingTitle}": ${trimmedBody.slice(0, 90)}`,
    linkPath: `/messages/${conv.conversationCode}`,
  });

  const dto = toMessageDto(messageDoc, actor._id);
  const io = getSocketInstance();
  if (io) {
    io.to(`conversation:${conv.conversationCode}`).emit('message:new', {
      conversationCode: conv.conversationCode,
      message: {
        ...dto,
        isMine: false,
      },
    });
  }

  return dto;
}

export async function markConversationMessagesRead(actor, conversationCode) {
  const conv = await getScopedConversationOrThrow(conversationCode, actor._id);
  const now = new Date();

  const result = await Message.updateMany(
    {
      conversationId: conv._id,
      senderId: { $ne: actor._id },
      readAt: null,
    },
    {
      $set: { readAt: now },
      $addToSet: { readBy: actor._id },
    }
  );

  return {
    conversationCode: conv.conversationCode,
    markedReadCount: result.modifiedCount || 0,
  };
}
