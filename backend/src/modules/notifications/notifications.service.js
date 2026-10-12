import { Notification } from '../../models/Notification.model.js';
import { toNotificationDto } from '../../services/notification.service.js';
import { AppError } from '../../utils/app-error.js';
import { parsePagination } from '../../utils/pagination.js';

export async function listMyNotifications(actor, query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { userId: actor._id };

  const [rows, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(filter),
  ]);

  return {
    items: rows.map(toNotificationDto),
    meta: { page, limit, total },
  };
}

export async function getMyUnreadNotificationCount(actor) {
  const unreadCount = await Notification.countDocuments({
    userId: actor._id,
    readAt: null,
  });
  return { unreadCount };
}

export async function markNotificationRead(actor, notificationCode) {
  const doc = await Notification.findOneAndUpdate(
    {
      notificationCode,
      userId: actor._id,
    },
    {
      $set: { readAt: new Date() },
    },
    { returnDocument: 'after' }
  );

  if (!doc) {
    throw new AppError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found.');
  }

  return toNotificationDto(doc);
}

export async function markAllNotificationsRead(actor) {
  const result = await Notification.updateMany(
    { userId: actor._id, readAt: null },
    { $set: { readAt: new Date() } }
  );
  return { markedReadCount: result.modifiedCount || 0 };
}
