import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { ACCOUNT_STATUS } from '../constants/account-status.js';
import { ROLES } from '../constants/roles.js';
import { User } from '../models/User.model.js';
import { recordAuditEvent } from '../services/audit.service.js';
import {
  generateUniquePublicCode,
  PUBLIC_ID_PREFIXES,
} from '../services/public-id.service.js';

export async function provisionAdminAccount({
  fullName = process.env.ADMIN_FULL_NAME || 'Campus Moderator (Admin)',
  collegeEmail = process.env.ADMIN_EMAIL || 'admin@nitk.edu.in',
  password = process.env.ADMIN_PASSWORD || 'AdminCampus@2026',
}) {
  const normalizedEmail = String(collegeEmail).trim().toLowerCase();
  const existing = await User.findOne({ collegeEmail: normalizedEmail });
  const passwordHash = await bcrypt.hash(password, 10);

  if (existing) {
    existing.role = ROLES.ADMIN;
    existing.accountStatus = ACCOUNT_STATUS.ACTIVE;
    existing.emailVerifiedAt = existing.emailVerifiedAt || new Date();
    existing.passwordHash = passwordHash;
    await existing.save();
    return existing;
  }

  const userCode = await generateUniquePublicCode(User, 'userCode', PUBLIC_ID_PREFIXES.USER);
  const admin = await User.create({
    userCode,
    fullName,
    collegeEmail: normalizedEmail,
    passwordHash,
    role: ROLES.ADMIN,
    emailVerifiedAt: new Date(),
    accountStatus: ACCOUNT_STATUS.ACTIVE,
    branch: 'GENERAL',
    academicYear: '4',
    bio: 'Official CampusExchange moderation and academic resource administrator.',
  });

  await recordAuditEvent({
    actorId: admin._id,
    actorRole: ROLES.ADMIN,
    action: 'admin.provisioned',
    targetType: 'user',
    targetId: admin.userCode,
  });

  return admin;
}

const isDirect =
  process.argv[1] && process.argv[1].includes('create-admin.js');

if (isDirect) {
  connectDatabase()
    .then(() => provisionAdminAccount({}))
    .then((admin) => {
      console.log(`Admin provisioned successfully: ${admin.userCode} (${admin.collegeEmail})`);
      return disconnectDatabase();
    })
    .catch((err) => {
      console.error('Failed to provision admin:', err.message);
      process.exit(1);
    });
}
