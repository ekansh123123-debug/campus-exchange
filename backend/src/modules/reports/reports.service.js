import {
  REPORT_STATUS,
  REPORT_TARGET_TYPES,
} from '../../constants/upload-limits.js';
import { Listing } from '../../models/Listing.model.js';
import { Report } from '../../models/Report.model.js';
import { Resource } from '../../models/Resource.model.js';
import { User } from '../../models/User.model.js';
import {
  generateUniquePublicCode,
  PUBLIC_ID_PREFIXES,
} from '../../services/public-id.service.js';
import { recordAuditEvent } from '../../services/audit.service.js';
import { AppError } from '../../utils/app-error.js';
import { parsePagination } from '../../utils/pagination.js';
import { toSafePublicUser } from '../../utils/safe-user.js';

export function toReportDto(reportDoc, includeAdminDetails = false) {
  const r = typeof reportDoc.toObject === 'function' ? reportDoc.toObject() : reportDoc;
  const dto = {
    reportCode: r.reportCode,
    targetType: r.targetType,
    targetCode: r.targetCode,
    reason: r.reason,
    details: r.details || '',
    status: r.status,
    resolutionNote: r.resolutionNote || '',
    resolvedAt: r.resolvedAt ? new Date(r.resolvedAt).toISOString() : null,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
  };

  if (includeAdminDetails) {
    dto.reporter =
      r.reporterId && typeof r.reporterId === 'object' && r.reporterId.userCode
        ? toSafePublicUser(r.reporterId)
        : null;
    dto.assignedAdmin =
      r.assignedAdminId &&
      typeof r.assignedAdminId === 'object' &&
      r.assignedAdminId.userCode
        ? toSafePublicUser(r.assignedAdminId)
        : null;
    dto.resolvedByAdmin =
      r.resolvedByAdminId &&
      typeof r.resolvedByAdminId === 'object' &&
      r.resolvedByAdminId.userCode
        ? toSafePublicUser(r.resolvedByAdminId)
        : null;
  }

  return dto;
}

export async function createReport({ actor, payload, requestId = '' }) {
  let targetDoc = null;
  if (payload.targetType === REPORT_TARGET_TYPES.LISTING) {
    targetDoc = await Listing.findOne({ listingCode: payload.targetCode });
  } else if (payload.targetType === REPORT_TARGET_TYPES.USER) {
    targetDoc = await User.findOne({ userCode: payload.targetCode });
    if (targetDoc && String(targetDoc._id) === String(actor._id)) {
      throw new AppError(400, 'SELF_REPORT_FORBIDDEN', 'You cannot report your own account.');
    }
  } else if (payload.targetType === REPORT_TARGET_TYPES.RESOURCE) {
    targetDoc = await Resource.findOne({ resourceCode: payload.targetCode });
  }

  if (!targetDoc) {
    throw new AppError(404, 'REPORT_TARGET_NOT_FOUND', 'The reported item or user was not found.');
  }

  const reportCode = await generateUniquePublicCode(
    Report,
    'reportCode',
    PUBLIC_ID_PREFIXES.REPORT
  );

  const report = await Report.create({
    reportCode,
    reporterId: actor._id,
    targetType: payload.targetType,
    targetId: targetDoc._id,
    targetCode: payload.targetCode,
    reason: payload.reason.trim(),
    details: (payload.details || '').trim(),
    status: REPORT_STATUS.OPEN,
  });

  await recordAuditEvent({
    actorId: actor._id,
    actorRole: actor.role,
    action: 'report.created',
    targetType: payload.targetType,
    targetId: payload.targetCode,
    metadata: { reportCode },
    requestId,
  });

  return toReportDto(report, false);
}

export async function listMyReports(actor, query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { reporterId: actor._id };

  const [rows, total] = await Promise.all([
    Report.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit),
    Report.countDocuments(filter),
  ]);

  return {
    items: rows.map((r) => toReportDto(r, false)),
    meta: { page, limit, total },
  };
}
