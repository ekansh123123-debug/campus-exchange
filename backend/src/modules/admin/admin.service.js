import { ACCOUNT_STATUS } from '../../constants/account-status.js';
import { LISTING_STATUS } from '../../constants/listing-status.js';
import { RESOURCE_STATUS } from '../../constants/resource-status.js';
import { TRANSACTION_STATUS } from '../../constants/transaction-status.js';
import { REPORT_STATUS } from '../../constants/upload-limits.js';
import { ROLES } from '../../constants/roles.js';
import { AuditEvent } from '../../models/AuditEvent.model.js';
import { Listing } from '../../models/Listing.model.js';
import { Report } from '../../models/Report.model.js';
import { Resource } from '../../models/Resource.model.js';
import { Transaction } from '../../models/Transaction.model.js';
import { User } from '../../models/User.model.js';
import { toListingDto } from '../listings/listings.service.js';
import { toResourceDto } from '../resources/resources.service.js';
import { toReportDto } from '../reports/reports.service.js';
import { revokeAllUserSessions } from '../../services/token.service.js';
import {
  createNotification,
  getSocketInstance,
} from '../../services/notification.service.js';
import { recordAuditEvent } from '../../services/audit.service.js';
import { AppError } from '../../utils/app-error.js';
import { parsePagination } from '../../utils/pagination.js';
import { toSafeAdminUser } from '../../utils/safe-user.js';

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function getAdminDashboardStats() {
  const [
    activeUsers,
    blockedUsers,
    pendingListings,
    activeListings,
    pendingResources,
    activeResources,
    completedTransactions,
    unresolvedReports,
  ] = await Promise.all([
    User.countDocuments({
      role: ROLES.STUDENT,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
      emailVerifiedAt: { $ne: null },
    }),
    User.countDocuments({ accountStatus: ACCOUNT_STATUS.BLOCKED }),
    Listing.countDocuments({ status: LISTING_STATUS.PENDING }),
    Listing.countDocuments({ status: LISTING_STATUS.ACTIVE }),
    Resource.countDocuments({ status: RESOURCE_STATUS.PENDING }),
    Resource.countDocuments({ status: RESOURCE_STATUS.ACTIVE }),
    Transaction.countDocuments({ status: TRANSACTION_STATUS.COMPLETED }),
    Report.countDocuments({
      status: { $in: [REPORT_STATUS.OPEN, REPORT_STATUS.IN_REVIEW] },
    }),
  ]);

  return {
    activeUsers,
    blockedUsers,
    pendingListings,
    activeListings,
    pendingResources,
    activeResources,
    completedTransactions,
    unresolvedReports,
  };
}

export async function listAdminListingsQueue(actor, query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.status && query.status !== 'all') {
    filter.status = query.status;
  }

  const [rows, total] = await Promise.all([
    Listing.find(filter)
      .sort({ createdAt: 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .populate(['categoryId', 'sellerId']),
    Listing.countDocuments(filter),
  ]);

  return {
    items: rows.map((r) => toListingDto(r, actor)),
    meta: { page, limit, total },
  };
}

export async function approvePendingListing({
  actor,
  listingCode,
  requestId = '',
}) {
  const updated = await Listing.findOneAndUpdate(
    {
      listingCode,
      status: LISTING_STATUS.PENDING,
    },
    {
      $set: {
        status: LISTING_STATUS.ACTIVE,
        'moderation.reviewedAt': new Date(),
        'moderation.reviewedBy': actor._id,
        'moderation.rejectionReason': null,
      },
    },
    { returnDocument: 'after' }
  ).populate(['categoryId', 'sellerId']);

  if (!updated) {
    const existing = await Listing.findOne({ listingCode });
    if (!existing) {
      throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing not found.');
    }
    throw new AppError(
      409,
      'INVALID_LISTING_STATE',
      `Listing is currently "${existing.status}" and cannot be approved.`
    );
  }

  await createNotification({
    userId: updated.sellerId._id || updated.sellerId,
    eventType: 'listing_approved',
    title: 'Listing Approved & Published',
    body: `Your listing "${updated.title}" (${updated.listingCode}) has been approved and is now active in the marketplace.`,
    linkPath: `/listings/${updated.listingCode}`,
  });

  await recordAuditEvent({
    actorId: actor._id,
    actorRole: actor.role,
    action: 'admin.listing_approved',
    targetType: 'listing',
    targetId: updated.listingCode,
    requestId,
  });

  return toListingDto(updated, actor);
}

export async function rejectPendingListing({
  actor,
  listingCode,
  reason,
  requestId = '',
}) {
  const updated = await Listing.findOneAndUpdate(
    {
      listingCode,
      status: { $in: [LISTING_STATUS.PENDING, LISTING_STATUS.ACTIVE] },
    },
    {
      $set: {
        status: LISTING_STATUS.REJECTED,
        'moderation.reviewedAt': new Date(),
        'moderation.reviewedBy': actor._id,
        'moderation.rejectionReason': reason.trim(),
      },
    },
    { returnDocument: 'after' }
  ).populate(['categoryId', 'sellerId']);

  if (!updated) {
    const existing = await Listing.findOne({ listingCode });
    if (!existing) {
      throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing not found.');
    }
    throw new AppError(
      409,
      'INVALID_LISTING_STATE',
      `Listing in "${existing.status}" state cannot be rejected.`
    );
  }

  await createNotification({
    userId: updated.sellerId._id || updated.sellerId,
    eventType: 'listing_rejected',
    title: 'Listing Requires Changes',
    body: `Your listing "${updated.title}" (${updated.listingCode}) was not approved. Reason: ${reason.trim()}`,
    linkPath: `/my-listings`,
  });

  await recordAuditEvent({
    actorId: actor._id,
    actorRole: actor.role,
    action: 'admin.listing_rejected',
    targetType: 'listing',
    targetId: updated.listingCode,
    metadata: { reason: reason.trim() },
    requestId,
  });

  return toListingDto(updated, actor);
}

export async function listAdminResourcesQueue(actor, query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.status && query.status !== 'all') {
    filter.status = query.status;
  }

  const [rows, total] = await Promise.all([
    Resource.find(filter)
      .sort({ createdAt: 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .populate('uploaderId'),
    Resource.countDocuments(filter),
  ]);

  return {
    items: rows.map((r) => toResourceDto(r, actor)),
    meta: { page, limit, total },
  };
}

export async function approvePendingResource({
  actor,
  resourceCode,
  requestId = '',
}) {
  const updated = await Resource.findOneAndUpdate(
    {
      resourceCode,
      status: RESOURCE_STATUS.PENDING,
    },
    {
      $set: {
        status: RESOURCE_STATUS.ACTIVE,
        'moderation.reviewedAt': new Date(),
        'moderation.reviewedBy': actor._id,
        'moderation.rejectionReason': null,
      },
    },
    { returnDocument: 'after' }
  ).populate('uploaderId');

  if (!updated) {
    const existing = await Resource.findOne({ resourceCode });
    if (!existing) {
      throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Resource not found.');
    }
    throw new AppError(
      409,
      'INVALID_RESOURCE_STATE',
      `Resource in "${existing.status}" state cannot be approved.`
    );
  }

  await createNotification({
    userId: updated.uploaderId._id || updated.uploaderId,
    eventType: 'resource_approved',
    title: 'Study Resource Approved',
    body: `Your uploaded resource "${updated.title}" (${updated.resourceCode}) is now live in the study library.`,
    linkPath: `/resources`,
  });

  await recordAuditEvent({
    actorId: actor._id,
    actorRole: actor.role,
    action: 'admin.resource_approved',
    targetType: 'resource',
    targetId: updated.resourceCode,
    requestId,
  });

  return toResourceDto(updated, actor);
}

export async function rejectPendingResource({
  actor,
  resourceCode,
  reason,
  requestId = '',
}) {
  const updated = await Resource.findOneAndUpdate(
    {
      resourceCode,
      status: RESOURCE_STATUS.PENDING,
    },
    {
      $set: {
        status: RESOURCE_STATUS.REJECTED,
        'moderation.reviewedAt': new Date(),
        'moderation.reviewedBy': actor._id,
        'moderation.rejectionReason': reason.trim(),
      },
    },
    { returnDocument: 'after' }
  ).populate('uploaderId');

  if (!updated) {
    const existing = await Resource.findOne({ resourceCode });
    if (!existing) {
      throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Resource not found.');
    }
    throw new AppError(
      409,
      'INVALID_RESOURCE_STATE',
      `Resource in "${existing.status}" state cannot be rejected.`
    );
  }

  await createNotification({
    userId: updated.uploaderId._id || updated.uploaderId,
    eventType: 'resource_rejected',
    title: 'Study Resource Rejected',
    body: `Your resource "${updated.title}" (${updated.resourceCode}) was rejected. Reason: ${reason.trim()}`,
    linkPath: `/resources`,
  });

  await recordAuditEvent({
    actorId: actor._id,
    actorRole: actor.role,
    action: 'admin.resource_rejected',
    targetType: 'resource',
    targetId: updated.resourceCode,
    metadata: { reason: reason.trim() },
    requestId,
  });

  return toResourceDto(updated, actor);
}

export async function takedownResource({
  actor,
  resourceCode,
  reason,
  requestId = '',
}) {
  const updated = await Resource.findOneAndUpdate(
    {
      resourceCode,
      status: { $in: [RESOURCE_STATUS.ACTIVE, RESOURCE_STATUS.PENDING] },
    },
    {
      $set: {
        status: RESOURCE_STATUS.REMOVED,
        'moderation.takedownReason': reason.trim(),
        'moderation.takedownAt': new Date(),
        'moderation.reviewedBy': actor._id,
      },
    },
    { returnDocument: 'after' }
  ).populate('uploaderId');

  if (!updated) {
    const existing = await Resource.findOne({ resourceCode });
    if (!existing) {
      throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Resource not found.');
    }
    throw new AppError(
      409,
      'INVALID_RESOURCE_STATE',
      `Resource in "${existing.status}" state is already removed.`
    );
  }

  await createNotification({
    userId: updated.uploaderId._id || updated.uploaderId,
    eventType: 'resource_taken_down',
    title: 'Study Resource Taken Down',
    body: `Your resource "${updated.title}" (${updated.resourceCode}) was removed by an administrator. Reason: ${reason.trim()}`,
    linkPath: `/resources`,
  });

  await recordAuditEvent({
    actorId: actor._id,
    actorRole: actor.role,
    action: 'admin.resource_takedown',
    targetType: 'resource',
    targetId: updated.resourceCode,
    metadata: { reason: reason.trim() },
    requestId,
  });

  return toResourceDto(updated, actor);
}

export async function listUsersForAdmin(query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (query.accountStatus) {
    filter.accountStatus = query.accountStatus;
  }
  if (query.branch) {
    filter.branch = String(query.branch).trim().toUpperCase();
  }
  if (query.q) {
    const safeQ = escapeRegex(query.q.trim());
    filter.$or = [
      { fullName: { $regex: safeQ, $options: 'i' } },
      { userCode: { $regex: safeQ, $options: 'i' } },
      { collegeEmail: { $regex: safeQ, $options: 'i' } },
    ];
  }

  const [rows, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return {
    items: rows.map(toSafeAdminUser),
    meta: { page, limit, total },
  };
}

export async function blockUserAccount({
  actor,
  userCode,
  reason,
  requestId = '',
}) {
  const targetUser = await User.findOne({ userCode });
  if (!targetUser) {
    throw new AppError(404, 'USER_NOT_FOUND', 'Target user account not found.');
  }

  if (String(targetUser._id) === String(actor._id)) {
    throw new AppError(400, 'SELF_BLOCK_FORBIDDEN', 'You cannot block your own administrator account.');
  }

  targetUser.accountStatus = ACCOUNT_STATUS.BLOCKED;
  targetUser.blockedAt = new Date();
  targetUser.blockedBy = actor._id;
  targetUser.blockReason = reason.trim();
  await targetUser.save();

  await revokeAllUserSessions(targetUser._id, 'admin_blocked');

  const io = getSocketInstance();
  if (io) {
    io.in(`user:${String(targetUser._id)}`).disconnectSockets(true);
  }

  await recordAuditEvent({
    actorId: actor._id,
    actorRole: actor.role,
    action: 'admin.user_blocked',
    targetType: 'user',
    targetId: targetUser.userCode,
    metadata: { reason: reason.trim() },
    requestId,
  });

  return toSafeAdminUser(targetUser);
}

export async function restoreUserAccount({
  actor,
  userCode,
  reason,
  requestId = '',
}) {
  const targetUser = await User.findOne({ userCode });
  if (!targetUser) {
    throw new AppError(404, 'USER_NOT_FOUND', 'Target user account not found.');
  }

  targetUser.accountStatus = ACCOUNT_STATUS.ACTIVE;
  targetUser.blockedAt = null;
  targetUser.blockedBy = null;
  targetUser.blockReason = null;
  await targetUser.save();

  await createNotification({
    userId: targetUser._id,
    eventType: 'account_restored',
    title: 'Account Restored',
    body: `Your CampusExchange account has been restored by an administrator.`,
    linkPath: `/app`,
  });

  await recordAuditEvent({
    actorId: actor._id,
    actorRole: actor.role,
    action: 'admin.user_restored',
    targetType: 'user',
    targetId: targetUser.userCode,
    metadata: { reason: reason.trim() },
    requestId,
  });

  return toSafeAdminUser(targetUser);
}

export async function listReportsForAdmin(query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.status) {
    filter.status = query.status;
  }

  const [rows, total] = await Promise.all([
    Report.find(filter)
      .sort({ createdAt: 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .populate(['reporterId', 'assignedAdminId', 'resolvedByAdminId']),
    Report.countDocuments(filter),
  ]);

  return {
    items: rows.map((r) => toReportDto(r, true)),
    meta: { page, limit, total },
  };
}

export async function assignReportToAdmin({
  actor,
  reportCode,
  requestId = '',
}) {
  const report = await Report.findOne({ reportCode });
  if (!report) {
    throw new AppError(404, 'REPORT_NOT_FOUND', 'Report not found.');
  }

  if (String(report.reporterId) === String(actor._id)) {
    throw new AppError(
      403,
      'SELF_REPORT_RESOLUTION_FORBIDDEN',
      'Reporters cannot assign or resolve their own reports.'
    );
  }

  if (![REPORT_STATUS.OPEN, REPORT_STATUS.IN_REVIEW].includes(report.status)) {
    throw new AppError(
      409,
      'INVALID_REPORT_STATE',
      `Report in "${report.status}" state cannot be assigned.`
    );
  }

  report.status = REPORT_STATUS.IN_REVIEW;
  report.assignedAdminId = actor._id;
  await report.save();
  await report.populate(['reporterId', 'assignedAdminId', 'resolvedByAdminId']);

  await recordAuditEvent({
    actorId: actor._id,
    actorRole: actor.role,
    action: 'admin.report_assigned',
    targetType: 'report',
    targetId: report.reportCode,
    requestId,
  });

  return toReportDto(report, true);
}

export async function updateReportResolution({
  actor,
  reportCode,
  nextStatus,
  note = '',
  requestId = '',
}) {
  const report = await Report.findOne({ reportCode });
  if (!report) {
    throw new AppError(404, 'REPORT_NOT_FOUND', 'Report not found.');
  }

  if (String(report.reporterId) === String(actor._id)) {
    throw new AppError(
      403,
      'SELF_REPORT_RESOLUTION_FORBIDDEN',
      'Reporters cannot resolve or dismiss their own submitted reports.'
    );
  }

  if (![REPORT_STATUS.OPEN, REPORT_STATUS.IN_REVIEW].includes(report.status)) {
    throw new AppError(
      409,
      'INVALID_REPORT_STATE',
      `Report is already "${report.status}".`
    );
  }

  report.status = nextStatus;
  report.resolvedByAdminId = actor._id;
  report.resolvedAt = new Date();
  report.resolutionNote = String(note || '').trim();
  await report.save();
  await report.populate(['reporterId', 'assignedAdminId', 'resolvedByAdminId']);

  await createNotification({
    userId: report.reporterId._id || report.reporterId,
    eventType: 'report_updated',
    title: `Report ${report.reportCode} ${nextStatus === REPORT_STATUS.RESOLVED ? 'Resolved' : 'Reviewed'}`,
    body: `An administrator has reviewed your report (${report.reportCode}). Status: ${nextStatus}.`,
    linkPath: `/notifications`,
  });

  await recordAuditEvent({
    actorId: actor._id,
    actorRole: actor.role,
    action: `admin.report_${nextStatus}`,
    targetType: 'report',
    targetId: report.reportCode,
    metadata: { note: report.resolutionNote },
    requestId,
  });

  return toReportDto(report, true);
}

export async function listAuditEventsForAdmin(query = {}) {
  const { page, limit, skip } = parsePagination(query);

  const [rows, total] = await Promise.all([
    AuditEvent.find({})
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actorId'),
    AuditEvent.countDocuments({}),
  ]);

  return {
    items: rows.map((e) => ({
      id: String(e._id),
      action: e.action,
      actorRole: e.actorRole,
      actorCode: e.actorId?.userCode || 'SYSTEM',
      targetType: e.targetType,
      targetId: e.targetId,
      targetCode: e.targetId,
      reason: e.metadata?.reason || e.metadata?.note || '',
      metadata: e.metadata || {},
      requestId: e.requestId || '',
      createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : null,
    })),
    meta: { page, limit, total },
  };
}
