import { asyncHandler } from '../../utils/async-handler.js';
import { sendPaginated, sendSuccess } from '../../utils/api-response.js';
import {
  getMyUnreadNotificationCount,
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from './notifications.service.js';

export const listNotificationsController = asyncHandler(async (req, res) => {
  const result = await listMyNotifications(req.user, req.query);
  return sendPaginated(res, result.items, result.meta, 200);
});

export const unreadNotificationCountController = asyncHandler(async (req, res) => {
  const result = await getMyUnreadNotificationCount(req.user);
  return sendSuccess(res, result, 200);
});

export const markNotificationReadController = asyncHandler(async (req, res) => {
  const notification = await markNotificationRead(
    req.user,
    req.validatedParams.notificationCode
  );
  return sendSuccess(res, { notification }, 200);
});

export const markAllNotificationsReadController = asyncHandler(async (req, res) => {
  const result = await markAllNotificationsRead(req.user);
  return sendSuccess(res, result, 200);
});
