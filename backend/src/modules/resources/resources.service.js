import { RESOURCE_STATUS } from '../../constants/resource-status.js';
import { ROLES } from '../../constants/roles.js';
import { Resource } from '../../models/Resource.model.js';
import {
  generateUniquePublicCode,
  PUBLIC_ID_PREFIXES,
} from '../../services/public-id.service.js';
import {
  deleteStoredMedia,
  getAuthorizedResourcePayload,
  validateAndUploadResourceFile,
} from '../../services/media.service.js';
import { createNotification } from '../../services/notification.service.js';
import { recordAuditEvent } from '../../services/audit.service.js';
import { AppError } from '../../utils/app-error.js';
import { parsePagination } from '../../utils/pagination.js';
import { toSafePublicUser } from '../../utils/safe-user.js';

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function toResourceDto(resourceDoc, viewer = null) {
  const r = typeof resourceDoc.toObject === 'function' ? resourceDoc.toObject() : resourceDoc;
  const uploaderIdStr = String(r.uploaderId?._id || r.uploaderId);
  const viewerIdStr = viewer ? String(viewer._id || viewer.id) : '';
  const isOwner = Boolean(viewerIdStr && viewerIdStr === uploaderIdStr);
  const isAdmin = viewer?.role === ROLES.ADMIN;

  const dto = {
    resourceCode: r.resourceCode,
    title: r.title,
    description: r.description || '',
    resourceType: r.resourceType,
    branch: r.branch,
    academicYear: r.academicYear,
    semester: r.semester || '',
    subject: r.subject,
    examYear: r.examYear || '',
    fileInfo: {
      mimeType: r.file?.mimeType || 'application/pdf',
      byteSize: r.file?.byteSize || 0,
    },
    status: r.status,
    downloadCount: Number(r.downloadCount || 0),
    isOwner,
    isDemoSeed: Boolean(r.isDemoSeed),
    uploader:
      r.uploaderId && typeof r.uploaderId === 'object' && r.uploaderId.userCode
        ? toSafePublicUser(r.uploaderId)
        : null,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
  };

  if (isOwner || isAdmin) {
    dto.moderation = {
      submittedAt: r.moderation?.submittedAt
        ? new Date(r.moderation.submittedAt).toISOString()
        : null,
      reviewedAt: r.moderation?.reviewedAt
        ? new Date(r.moderation.reviewedAt).toISOString()
        : null,
      rejectionReason: r.moderation?.rejectionReason || null,
      takedownReason: r.moderation?.takedownReason || null,
      takedownAt: r.moderation?.takedownAt
        ? new Date(r.moderation.takedownAt).toISOString()
        : null,
    };
  }

  return dto;
}

export async function uploadResource({
  actor,
  payload,
  file,
  requestId = '',
}) {
  const uploadedFile = await validateAndUploadResourceFile(file);

  try {
    const resourceCode = await generateUniquePublicCode(
      Resource,
      'resourceCode',
      PUBLIC_ID_PREFIXES.RESOURCE
    );

    const resource = await Resource.create({
      resourceCode,
      uploaderId: actor._id,
      title: payload.title.trim(),
      description: (payload.description || '').trim(),
      resourceType: payload.resourceType,
      branch: payload.branch.trim().toUpperCase(),
      academicYear: payload.academicYear.trim(),
      semester: (payload.semester || '').trim(),
      subject: payload.subject.trim(),
      examYear: (payload.examYear || '').trim(),
      file: uploadedFile,
      status: RESOURCE_STATUS.PENDING,
      copyrightAttested: true,
      moderation: {
        submittedAt: new Date(),
      },
    });

    await resource.populate('uploaderId');

    await createNotification({
      userId: actor._id,
      eventType: 'resource_submitted',
      title: 'Study Resource Submitted for Review',
      body: `"${resource.title}" (${resource.resourceCode}) is pending administrator moderation.`,
      linkPath: `/resources`,
    });

    await recordAuditEvent({
      actorId: actor._id,
      actorRole: actor.role,
      action: 'resource.uploaded',
      targetType: 'resource',
      targetId: resource.resourceCode,
      requestId,
    });

    return toResourceDto(resource, actor);
  } catch (err) {
    await deleteStoredMedia(uploadedFile.provider, uploadedFile.fileId);
    throw err;
  }
}

export async function searchApprovedResources(actor, query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {
    status: RESOURCE_STATUS.ACTIVE,
  };

  if (query.branch) {
    filter.branch = String(query.branch).trim().toUpperCase();
  }
  const yearVal = query.year || query.academicYear;
  if (yearVal) {
    filter.academicYear = String(yearVal).trim();
  }
  if (query.semester) {
    filter.semester = String(query.semester).trim();
  }
  if (query.resourceType) {
    filter.resourceType = query.resourceType;
  }
  if (query.examYear) {
    filter.examYear = String(query.examYear).trim();
  }

  const andConditions = [];
  if (query.subject) {
    const safeSubj = escapeRegex(query.subject.trim());
    andConditions.push({
      subject: { $regex: safeSubj, $options: 'i' },
    });
  }
  if (query.q) {
    const safeQ = escapeRegex(query.q.trim());
    andConditions.push({
      $or: [
        { title: { $regex: safeQ, $options: 'i' } },
        { subject: { $regex: safeQ, $options: 'i' } },
        { description: { $regex: safeQ, $options: 'i' } },
      ],
    });
  }
  if (andConditions.length > 0) {
    filter.$and = andConditions;
  }

  const [rows, total] = await Promise.all([
    Resource.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate('uploaderId'),
    Resource.countDocuments(filter),
  ]);

  return {
    items: rows.map((row) => toResourceDto(row, actor)),
    meta: { page, limit, total },
  };
}

export async function listMyResources(actor, query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { uploaderId: actor._id };

  const [rows, total] = await Promise.all([
    Resource.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate('uploaderId'),
    Resource.countDocuments(filter),
  ]);

  return {
    items: rows.map((row) => toResourceDto(row, actor)),
    meta: { page, limit, total },
  };
}

export async function getResourceByCode(actor, resourceCode) {
  const resource = await Resource.findOne({ resourceCode }).populate('uploaderId');
  if (!resource) {
    throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Resource not found.');
  }

  const isOwner = Boolean(
    actor?._id && String(resource.uploaderId?._id || resource.uploaderId) === String(actor._id)
  );
  const isAdmin = actor?.role === ROLES.ADMIN;

  if (resource.status !== RESOURCE_STATUS.ACTIVE && !isOwner && !isAdmin) {
    throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Resource not found.');
  }

  return toResourceDto(resource, actor);
}

export async function authorizeAndPrepareResourceDownload({
  actor,
  resourceCode,
  requestId = '',
}) {
  const resource = await Resource.findOne({ resourceCode });
  if (!resource) {
    throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Study resource not found.');
  }

  const isAdmin = actor.role === ROLES.ADMIN;
  if (resource.status !== RESOURCE_STATUS.ACTIVE && !isAdmin) {
    throw new AppError(
      403,
      'RESOURCE_NOT_APPROVED',
      'This study resource is not approved for download.'
    );
  }

  await Resource.updateOne({ _id: resource._id }, { $inc: { downloadCount: 1 } });

  await recordAuditEvent({
    actorId: actor._id,
    actorRole: actor.role,
    action: 'resource.downloaded',
    targetType: 'resource',
    targetId: resource.resourceCode,
    requestId,
  });

  return getAuthorizedResourcePayload(resource);
}
