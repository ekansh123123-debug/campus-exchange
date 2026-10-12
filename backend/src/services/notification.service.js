import { Notification } from '../models/Notification.model.js';
import {
  generateUniquePublicCode,
  PUBLIC_ID_PREFIXES,
} from './public-id.service.js';
import { logger } from '../config/logger.js';

let ioInstance = null;

export function setSocketInstance(io) {
  ioInstance = io;
}

export function getSocketInstance() {
  return ioInstance;
}

export async function createNotification({
  userId,
  eventType,
  title,
  body,
  linkPath = '/app',
}) {
  if (!userId) return null;
  try {
    const notificationCode = await generateUniquePublicCode(
      Notification,
      'notificationCode',
      PUBLIC_ID_PREFIXES.NOTIFICATION
    );
    const doc = await Notification.create({
      notificationCode,
      userId,
      eventType: String(eventType).slice(0, 80),
      title: String(title).slice(0, 160),
      body: String(body).slice(0, 600),
      linkPath: String(linkPath || '/app').startsWith('/')
        ? String(linkPath).slice(0, 200)
        : '/app',
    });

    const dto = toNotificationDto(doc);
    if (ioInstance) {
      ioInstance.to(`user:${String(userId)}`).emit('notification:new', dto);
    }
    return dto;
  } catch (err) {
    logger.warn({ event: 'notification_create_failed', reason: err.message });
    return null;
  }
}

export function toNotificationDto(doc) {
  const n = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    notificationCode: n.notificationCode,
    eventType: n.eventType,
    title: n.title,
    body: n.body,
    linkPath: n.linkPath,
    isRead: Boolean(n.readAt),
    readAt: n.readAt ? new Date(n.readAt).toISOString() : null,
    createdAt: n.createdAt ? new Date(n.createdAt).toISOString() : null,
  };
}
