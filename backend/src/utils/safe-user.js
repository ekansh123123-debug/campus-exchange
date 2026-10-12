export function toSafeCurrentUser(userDoc) {
  if (!userDoc) return null;
  const u = typeof userDoc.toObject === 'function' ? userDoc.toObject() : userDoc;
  return {
    id: String(u._id || u.id),
    userCode: u.userCode,
    fullName: u.fullName,
    collegeEmail: u.collegeEmail,
    role: u.role,
    isEmailVerified: Boolean(u.emailVerifiedAt),
    emailVerifiedAt: u.emailVerifiedAt ? new Date(u.emailVerifiedAt).toISOString() : null,
    accountStatus: u.accountStatus,
    branch: u.branch || 'GENERAL',
    academicYear: u.academicYear || '1',
    bio: u.bio || '',
    avatar: u.avatar
      ? {
          url: u.avatar.url || '',
        }
      : null,
    contactPreferences: u.contactPreferences || {
      inAppChat: true,
      showBranchYear: true,
    },
    ratingAverage: Number(u.ratingAverage || 0),
    ratingCount: Number(u.ratingCount || 0),
    completedTransactionsCount: Number(u.completedTransactionsCount || 0),
    createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
  };
}

export function toSafePublicUser(userDoc) {
  if (!userDoc) return null;
  const u = typeof userDoc.toObject === 'function' ? userDoc.toObject() : userDoc;
  const showBranchYear = u.contactPreferences?.showBranchYear !== false;
  return {
    userCode: u.userCode,
    fullName: u.fullName,
    branch: showBranchYear ? u.branch || 'GENERAL' : null,
    academicYear: showBranchYear ? u.academicYear || '1' : null,
    bio: u.bio || '',
    avatarUrl: u.avatar?.url || '',
    isVerifiedStudent: Boolean(u.emailVerifiedAt),
    ratingAverage: Number(u.ratingAverage || 0),
    ratingCount: Number(u.ratingCount || 0),
    completedTransactionsCount: Number(u.completedTransactionsCount || 0),
    joinedAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
  };
}

export function toSafeAdminUser(userDoc) {
  if (!userDoc) return null;
  const u = typeof userDoc.toObject === 'function' ? userDoc.toObject() : userDoc;
  return {
    id: String(u._id || u.id),
    userCode: u.userCode,
    fullName: u.fullName,
    collegeEmail: u.collegeEmail,
    role: u.role,
    isEmailVerified: Boolean(u.emailVerifiedAt),
    emailVerifiedAt: u.emailVerifiedAt ? new Date(u.emailVerifiedAt).toISOString() : null,
    accountStatus: u.accountStatus,
    branch: u.branch || 'GENERAL',
    academicYear: u.academicYear || '1',
    ratingAverage: Number(u.ratingAverage || 0),
    ratingCount: Number(u.ratingCount || 0),
    completedTransactionsCount: Number(u.completedTransactionsCount || 0),
    blockedAt: u.blockedAt ? new Date(u.blockedAt).toISOString() : null,
    blockReason: u.blockReason || null,
    createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
  };
}
