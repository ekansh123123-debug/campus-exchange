import { describe, expect, it } from 'vitest';
import {
  generatePublicCode,
  PUBLIC_ID_PREFIXES,
} from '../../services/public-id.service.js';
import {
  validateAndUploadImage,
  validateAndUploadResourceFile,
} from '../../services/media.service.js';
import { parsePagination } from '../../utils/pagination.js';
import {
  toSafeAdminUser,
  toSafeCurrentUser,
  toSafePublicUser,
} from '../../utils/safe-user.js';

describe('CampusExchange Core Unit Tests', () => {
  it('generates non-sequential public codes with required prefixes', () => {
    const userCode1 = generatePublicCode(PUBLIC_ID_PREFIXES.USER);
    const userCode2 = generatePublicCode(PUBLIC_ID_PREFIXES.USER);
    const listingCode = generatePublicCode(PUBLIC_ID_PREFIXES.LISTING);
    const txnCode = generatePublicCode(PUBLIC_ID_PREFIXES.TRANSACTION);
    const resCode = generatePublicCode(PUBLIC_ID_PREFIXES.RESOURCE);
    const repCode = generatePublicCode(PUBLIC_ID_PREFIXES.REPORT);
    const convCode = generatePublicCode(PUBLIC_ID_PREFIXES.CONVERSATION);

    expect(userCode1).toMatch(/^CEU-[A-Z0-9]{8}$/);
    expect(userCode2).toMatch(/^CEU-[A-Z0-9]{8}$/);
    expect(userCode1).not.toBe(userCode2);
    expect(listingCode).toMatch(/^CEL-[A-Z0-9]{8}$/);
    expect(txnCode).toMatch(/^CET-[A-Z0-9]{8}$/);
    expect(resCode).toMatch(/^CER-[A-Z0-9]{8}$/);
    expect(repCode).toMatch(/^CERPT-[A-Z0-9]{8}$/);
    expect(convCode).toMatch(/^CEC-[A-Z0-9]{8}$/);
  });

  it('bounds pagination parameters safely', () => {
    expect(parsePagination({ page: '-5', limit: '9999' })).toEqual({
      page: 1,
      limit: 100,
      skip: 0,
    });
    expect(parsePagination({ page: '3', limit: '15' })).toEqual({
      page: 3,
      limit: 15,
      skip: 30,
    });
  });

  it('excludes passwordHash, tokens, and private fields from user DTOs', () => {
    const rawUser = {
      _id: '507f1f77bcf86cd799439011',
      userCode: 'CEU-ABCDEF23',
      fullName: 'Rohan Kulkarni',
      collegeEmail: 'rohan@nitk.edu.in',
      passwordHash: '$2a$10$secretHashValue',
      role: 'student',
      emailVerifiedAt: new Date(),
      accountStatus: 'active',
      branch: 'CSE',
      academicYear: '3',
      contactPreferences: { inAppChat: true, showBranchYear: true },
      blockReason: 'internal admin note',
      ratingAverage: 4.5,
      ratingCount: 2,
    };

    const pub = toSafePublicUser(rawUser);
    expect(pub.passwordHash).toBeUndefined();
    expect(pub.collegeEmail).toBeUndefined();
    expect(pub.contactPreferences).toBeUndefined();
    expect(pub.blockReason).toBeUndefined();
    expect(pub.userCode).toBe('CEU-ABCDEF23');

    const cur = toSafeCurrentUser(rawUser);
    expect(cur.passwordHash).toBeUndefined();
    expect(cur.blockReason).toBeUndefined();
    expect(cur.collegeEmail).toBe('rohan@nitk.edu.in');

    const adm = toSafeAdminUser(rawUser);
    expect(adm.passwordHash).toBeUndefined();
    expect(adm.blockReason).toBe('internal admin note');
  });

  it('validates file signatures and rejects spoofed MIME types or path traversal names', async () => {
    await expect(
      validateAndUploadResourceFile({
        originalname: '../secret.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 valid header'),
      })
    ).rejects.toMatchObject({ code: 'INVALID_FILE_NAME' });

    await expect(
      validateAndUploadResourceFile({
        originalname: 'notes.exe',
        mimetype: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 valid header'),
      })
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_FILE_EXTENSION' });

    await expect(
      validateAndUploadResourceFile({
        originalname: 'spoofed.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('This is plain text pretending to be a PDF'),
      })
    ).rejects.toMatchObject({ code: 'INVALID_FILE_SIGNATURE' });

    const validPdf = await validateAndUploadResourceFile({
      originalname: 'signals-pyq.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n1 0 obj <<>> endobj\n%%EOF'),
    });
    expect(validPdf.mimeType).toBe('application/pdf');
    expect(validPdf.safeFileName).toMatch(/^res-.*\.pdf$/);

    await expect(
      validateAndUploadImage({
        originalname: 'fake.png',
        mimetype: 'image/png',
        buffer: Buffer.from('not-an-image-signature'),
      })
    ).rejects.toMatchObject({ code: 'INVALID_FILE_SIGNATURE' });
  });

  it('rejects negative or non-numeric prices on listing PATCH and supports status=all on admin queues', async () => {
    const { updateListingBodySchema } = await import(
      '../../modules/listings/listings.validation.js'
    );
    const { adminListingsQuerySchema, adminResourcesQuerySchema } = await import(
      '../../modules/admin/admin.validation.js'
    );

    expect(updateListingBodySchema.safeParse({ price: -100 }).success).toBe(false);
    expect(updateListingBodySchema.safeParse({ price: 'abc' }).success).toBe(false);
    expect(updateListingBodySchema.safeParse({ pricePaise: -50 }).success).toBe(false);
    expect(updateListingBodySchema.safeParse({ price: 350 }).success).toBe(true);

    expect(adminListingsQuerySchema.safeParse({ status: 'all' }).success).toBe(true);
    expect(adminResourcesQuerySchema.safeParse({ status: 'all' }).success).toBe(true);
  });
});
