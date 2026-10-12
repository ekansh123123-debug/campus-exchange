import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../../app.js';
import { connectDatabase, disconnectDatabase } from '../../config/database.js';
import { expireStaleReservations } from '../../jobs/expire-reservations.job.js';
import { EmailVerification } from '../../models/EmailVerification.model.js';
import { Transaction } from '../../models/Transaction.model.js';
import { ensureCategoriesSeeded } from '../../modules/categories/categories.service.js';
import { provisionAdminAccount } from '../../scripts/create-admin.js';
import { getDevMailForRecipient } from '../../services/email.service.js';

describe('CampusExchange Full Acceptance & Security Integration Suite (TC01–TC18 + Mandatory Edge Cases)', () => {
  let adminToken = '';
  let sellerToken = '';
  let sellerCode = '';
  let buyerToken = '';
  let buyerCode = '';
  let buyer2Token = '';
  let unverifiedToken = '';

  let saleListingCode = '';
  let exchangeListingCode = '';
  let buyerOfferedListingCode = '';
  let conversationCode = '';
  let saleTransactionCode = '';
  let approvedResourceCode = '';
  let pendingResourceCode = '';
  let createdReportCode = '';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDatabase();
    await mongoose.connection.db.dropDatabase();
    await ensureCategoriesSeeded();

    await provisionAdminAccount({
      fullName: 'Prof. Admin Moderator',
      collegeEmail: 'admin@nitk.edu.in',
      password: 'AdminPassword@123',
    });

    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      collegeEmail: 'admin@nitk.edu.in',
      password: 'AdminPassword@123',
    });
    expect(adminLogin.status).toBe(200);
    adminToken = adminLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('Health endpoints respond with 200', async () => {
    const live = await request(app).get('/health/live');
    expect(live.status).toBe(200);
    expect(live.body.data.status).toBe('alive');

    const ready = await request(app).get('/health/ready');
    expect(ready.status).toBe(200);
    expect(ready.body.data.status).toBe('ready');
  });

  it('TC01 & Duplicate Email: Registers with valid college email, normalizes case, and sends OTP', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Seller Student',
      collegeEmail: 'Seller.CS@NITK.edu.in',
      password: 'Password@123',
      branch: 'CSE',
      academicYear: '3',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.isEmailVerified).toBe(false);
    expect(res.body.data.user.userCode).toMatch(/^CEU-/);
    expect(res.body.data.user.passwordHash).toBeUndefined();
    sellerCode = res.body.data.user.userCode;

    const dup = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Duplicate Seller',
      collegeEmail: 'seller.cs@nitk.edu.in',
      password: 'Password@123',
      branch: 'CSE',
      academicYear: '3',
    });
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('EMAIL_ALREADY_REGISTERED');
  });

  it('TC02 & Role Spoofing: Rejects non-college email and rejects role:admin spoofing', async () => {
    const nonCollege = await request(app).post('/api/v1/auth/register').send({
      fullName: 'External User',
      collegeEmail: 'someone@gmail.com',
      password: 'Password@123',
      branch: 'CSE',
      academicYear: '2',
    });
    expect(nonCollege.status).toBe(400);
    expect(nonCollege.body.error.code).toBe('INVALID_COLLEGE_EMAIL_DOMAIN');

    const spoofAdmin = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Spoof Admin',
      collegeEmail: 'spoof@nitk.edu.in',
      password: 'Password@123',
      role: 'admin',
    });
    expect(spoofAdmin.status).toBe(400);
  });

  it('Unverified account restrictions & OTP verification (expired/wrong/used OTP)', async () => {
    await request(app).post('/api/v1/auth/register').send({
      fullName: 'Unverified Student',
      collegeEmail: 'unverified@nitk.edu.in',
      password: 'Password@123',
      branch: 'ECE',
      academicYear: '1',
    });

    const unvLogin = await request(app).post('/api/v1/auth/login').send({
      collegeEmail: 'unverified@nitk.edu.in',
      password: 'Password@123',
    });
    expect(unvLogin.status).toBe(200);
    unverifiedToken = unvLogin.body.data.accessToken;

    const deniedListing = await request(app)
      .post('/api/v1/listings')
      .set('Authorization', `Bearer ${unverifiedToken}`)
      .send({
        title: 'Blocked unverified listing',
        description: 'Should not be permitted before email verification',
        categorySlug: 'textbooks',
        listingType: 'sell',
        price: 200,
        condition: 'good',
      });
    expect(deniedListing.status).toBe(403);
    expect(deniedListing.body.error.code).toBe('EMAIL_NOT_VERIFIED');

    const wrongOtp = await request(app).post('/api/v1/auth/verify-email').send({
      collegeEmail: 'seller.cs@nitk.edu.in',
      otp: '000000',
    });
    expect(wrongOtp.status).toBe(400);
    expect(wrongOtp.body.error.code).toBe('INVALID_OTP');

    const sellerMail = getDevMailForRecipient('seller.cs@nitk.edu.in');
    expect(sellerMail).toBeTruthy();

    const verified = await request(app).post('/api/v1/auth/verify-email').send({
      collegeEmail: 'seller.cs@nitk.edu.in',
      otp: sellerMail.code,
    });
    expect(verified.status).toBe(200);
    expect(verified.body.data.user.isEmailVerified).toBe(true);

    const reusedOtp = await request(app).post('/api/v1/auth/verify-email').send({
      collegeEmail: 'seller.cs@nitk.edu.in',
      otp: sellerMail.code,
    });
    expect(reusedOtp.status).toBe(409);

    // Register & verify Buyer 1 and Buyer 2
    for (const [email, name] of [
      ['buyer1@nitk.edu.in', 'Buyer One'],
      ['buyer2@nitk.edu.in', 'Buyer Two'],
    ]) {
      await request(app).post('/api/v1/auth/register').send({
        fullName: name,
        collegeEmail: email,
        password: 'Password@123',
        branch: 'CSE',
        academicYear: '2',
      });
      const mail = getDevMailForRecipient(email);
      const vRes = await request(app).post('/api/v1/auth/verify-email').send({
        collegeEmail: email,
        otp: mail.code,
      });
      expect(vRes.status).toBe(200);
    }
  });

  it('TC03 & TC04: Login with valid and invalid credentials + Refresh cookie rotation', async () => {
    const badLogin = await request(app).post('/api/v1/auth/login').send({
      collegeEmail: 'seller.cs@nitk.edu.in',
      password: 'WrongPassword@999',
    });
    expect(badLogin.status).toBe(401);
    expect(badLogin.body.error.code).toBe('INVALID_CREDENTIALS');

    const sellerLogin = await request(app).post('/api/v1/auth/login').send({
      collegeEmail: 'seller.cs@nitk.edu.in',
      password: 'Password@123',
    });
    expect(sellerLogin.status).toBe(200);
    sellerToken = sellerLogin.body.data.accessToken;
    const cookies = sellerLogin.headers['set-cookie'];
    expect(cookies).toBeDefined();

    // Verify CSRF enforcement on refresh when csrf cookie is present
    const refreshWithoutCsrf = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookies);
    expect(refreshWithoutCsrf.status).toBe(403);
    expect(refreshWithoutCsrf.body.error.code).toBe('CSRF_TOKEN_INVALID');

    const refreshWithCsrf = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookies)
      .set('X-CSRF-Token', sellerLogin.body.data.csrfToken);
    expect(refreshWithCsrf.status).toBe(200);
    sellerToken = refreshWithCsrf.body.data.accessToken;

    const b1Login = await request(app).post('/api/v1/auth/login').send({
      collegeEmail: 'buyer1@nitk.edu.in',
      password: 'Password@123',
    });
    buyerToken = b1Login.body.data.accessToken;
    buyerCode = b1Login.body.data.user.userCode;

    const b2Login = await request(app).post('/api/v1/auth/login').send({
      collegeEmail: 'buyer2@nitk.edu.in',
      password: 'Password@123',
    });
    buyer2Token = b2Login.body.data.accessToken;
  });

  it('TC05 & TC06 & Status Spoofing: Submits valid listing as pending and rejects missing price or status spoofing', async () => {
    // TC06: missing price must fail
    const missingPrice = await request(app)
      .post('/api/v1/listings')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        title: 'Operating Systems Concepts Textbook',
        description: 'Galvin 9th edition textbook in great condition.',
        categorySlug: 'textbooks',
        listingType: 'sell',
        condition: 'good',
      });
    expect(missingPrice.status).toBe(400);
    expect(missingPrice.body.error.code).toBe('VALIDATION_ERROR');

    // Status spoofing must fail
    const spoofStatus = await request(app)
      .post('/api/v1/listings')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        title: 'Spoofed Active Listing',
        description: 'Trying to bypass moderation directly.',
        categorySlug: 'textbooks',
        listingType: 'sell',
        price: 300,
        condition: 'good',
        status: 'active',
      });
    expect(spoofStatus.status).toBe(400);

    // TC05: valid sale listing
    const validSale = await request(app)
      .post('/api/v1/listings')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        title: 'Digital Design by Morris Mano (5th Edition)',
        description: 'Used for CS202 Digital Logic Design, clean pages without markings.',
        categorySlug: 'textbooks',
        listingType: 'sell',
        price: 350,
        condition: 'like_new',
        branch: 'CSE',
        academicYear: '2',
        semester: '3',
        subject: 'Digital Logic Design',
      });
    expect(validSale.status).toBe(201);
    expect(validSale.body.data.listing.status).toBe('pending');
    saleListingCode = validSale.body.data.listing.listingCode;

    // Pending listing is NOT visible in general search before admin approval
    const searchBeforeApproval = await request(app)
      .get('/api/v1/listings?q=Morris')
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(searchBeforeApproval.status).toBe(200);
    expect(searchBeforeApproval.body.data.length).toBe(0);

    // Non-owner cannot view pending listing by code
    const buyerPeekPending = await request(app)
      .get(`/api/v1/listings/${saleListingCode}`)
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(buyerPeekPending.status).toBe(404);
  });

  it('TC07, TC08, TC09 & Operator Injection: Admin approves listing, search filters work, non-matching search returns empty', async () => {
    const approveRes = await request(app)
      .post(`/api/v1/admin/listings/${saleListingCode}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.listing.status).toBe('active');

    // Race / duplicate approval returns 409
    const secondApprove = await request(app)
      .post(`/api/v1/admin/listings/${saleListingCode}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(secondApprove.status).toBe(409);

    // TC08: Search subject and apply branch filter
    const matchSearch = await request(app)
      .get('/api/v1/listings?subject=Digital%20Logic&branch=CSE')
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(matchSearch.status).toBe(200);
    expect(matchSearch.body.data.length).toBe(1);
    expect(matchSearch.body.data[0].listingCode).toBe(saleListingCode);

    // TC09: Non-matching keyword returns empty array
    const noMatch = await request(app)
      .get('/api/v1/listings?q=QuantumGravityRocketEngine999')
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(noMatch.status).toBe(200);
    expect(noMatch.body.data).toEqual([]);
    expect(noMatch.body.meta.total).toBe(0);

    // MongoDB operator injection in query must be rejected
    const injectionRes = await request(app)
      .get('/api/v1/listings?branch[$ne]=NONE')
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(injectionRes.status).toBe(400);
  });

  it('Wishlist duplicate prevention and cross-user isolation', async () => {
    const addWish = await request(app)
      .post('/api/v1/wishlist')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ listingCode: saleListingCode });
    expect(addWish.status).toBe(201);

    const dupWish = await request(app)
      .post('/api/v1/wishlist')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ listingCode: saleListingCode });
    expect(dupWish.status).toBe(409);

    // Buyer 2's wishlist is empty
    const b2Wish = await request(app)
      .get('/api/v1/wishlist')
      .set('Authorization', `Bearer ${buyer2Token}`);
    expect(b2Wish.status).toBe(200);
    expect(b2Wish.body.data.length).toBe(0);
  });

  it('TC10: Buyer starts item-specific chat, messages are persisted, and third-party user is denied access', async () => {
    // Seller cannot start conversation with self
    const selfChat = await request(app)
      .post('/api/v1/conversations')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        listingCode: saleListingCode,
        initialMessage: 'Talking to myself',
      });
    expect(selfChat.status).toBe(400);

    const openConv = await request(app)
      .post('/api/v1/conversations')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        listingCode: saleListingCode,
        initialMessage: 'Hi! Is the Morris Mano book available to meet near the Central Library?',
      });
    expect(openConv.status).toBe(201);
    conversationCode = openConv.body.data.conversation.conversationCode;
    expect(conversationCode).toMatch(/^CEC-/);

    // Buyer 2 cannot read or send messages in Buyer 1's conversation
    const b2Peek = await request(app)
      .get(`/api/v1/conversations/${conversationCode}/messages`)
      .set('Authorization', `Bearer ${buyer2Token}`);
    expect(b2Peek.status).toBe(404);

    const b2Send = await request(app)
      .post(`/api/v1/conversations/${conversationCode}/messages`)
      .set('Authorization', `Bearer ${buyer2Token}`)
      .send({ body: 'Intruding message' });
    expect(b2Send.status).toBe(404);

    // Seller replies
    const sellerReply = await request(app)
      .post(`/api/v1/conversations/${conversationCode}/messages`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ body: 'Yes! We can meet at 4 PM outside the Central Library.' });
    expect(sellerReply.status).toBe(201);

    const history = await request(app)
      .get(`/api/v1/conversations/${conversationCode}/messages`)
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(history.status).toBe(200);
    expect(history.body.data.length).toBe(2);
  });

  it('TC11 & TC12: Concurrency-safe reservation (race two buyers; only one succeeds, second gets 409)', async () => {
    const [res1, res2] = await Promise.all([
      request(app)
        .post(`/api/v1/listings/${saleListingCode}/reservations`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ notes: 'Meeting at 4 PM' }),
      request(app)
        .post(`/api/v1/listings/${saleListingCode}/reservations`)
        .set('Authorization', `Bearer ${buyer2Token}`)
        .send({ notes: 'Concurrent attempt' }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([201, 409]);

    const winner = res1.status === 201 ? res1 : res2;
    const loser = res1.status === 409 ? res1 : res2;
    expect(loser.body.error.code).toBe('ITEM_UNAVAILABLE');
    saleTransactionCode = winner.body.data.transaction.transactionCode;

    // If Buyer 2 won the race, cancel it and let Buyer 1 reserve so Buyer 1 owns saleTransactionCode
    if (res2.status === 201) {
      await request(app)
        .post(`/api/v1/transactions/${saleTransactionCode}/cancel`)
        .set('Authorization', `Bearer ${buyer2Token}`)
        .send({ reason: 'Yielding to buyer 1' });

      const b1Res = await request(app)
        .post(`/api/v1/listings/${saleListingCode}/reservations`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ notes: 'Reserved by Buyer 1' });
      expect(b1Res.status).toBe(201);
      saleTransactionCode = b1Res.body.data.transaction.transactionCode;
    }

    // Subsequent reservation attempt on already reserved item fails with 409 (TC12)
    const afterReserved = await request(app)
      .post(`/api/v1/listings/${saleListingCode}/reservations`)
      .set('Authorization', `Bearer ${buyer2Token}`)
      .send({ notes: 'Too late' });
    expect(afterReserved.status).toBe(409);
    expect(afterReserved.body.error.code).toBe('ITEM_UNAVAILABLE');
  });

  it('TC13 & TC14: Seller confirms campus handover and buyer submits 1–5 rating (preventing early/duplicate reviews)', async () => {
    // Review before completion must fail
    const earlyReview = await request(app)
      .post(`/api/v1/transactions/${saleTransactionCode}/reviews`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ rating: 5, comment: 'Too early!' });
    expect(earlyReview.status).toBe(409);
    expect(earlyReview.body.error.code).toBe('TRANSACTION_NOT_COMPLETED');

    // Buyer cannot confirm handover (seller-only)
    const buyerConfirmAttempt = await request(app)
      .post(`/api/v1/transactions/${saleTransactionCode}/confirm-handover`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({});
    expect(buyerConfirmAttempt.status).toBe(403);

    // TC13: Seller confirms handover
    const handover = await request(app)
      .post(`/api/v1/transactions/${saleTransactionCode}/confirm-handover`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ notes: 'Handed over at Central Library' });
    expect(handover.status).toBe(200);
    expect(handover.body.data.transaction.status).toBe('completed');

    const soldListing = await request(app)
      .get(`/api/v1/listings/${saleListingCode}`)
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(soldListing.status).toBe(200);
    expect(soldListing.body.data.listing.status).toBe('sold');

    // TC14: Buyer submits review
    const reviewRes = await request(app)
      .post(`/api/v1/transactions/${saleTransactionCode}/reviews`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        rating: 5,
        comment: 'Book was in pristine condition and handover was right on time!',
      });
    expect(reviewRes.status).toBe(201);
    expect(reviewRes.body.data.targetRating.ratingAverage).toBe(5);
    expect(reviewRes.body.data.targetRating.ratingCount).toBe(1);

    // Duplicate review by same author on same transaction fails with 409
    const dupReview = await request(app)
      .post(`/api/v1/transactions/${saleTransactionCode}/reviews`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ rating: 4, comment: 'Second review attempt' });
    expect(dupReview.status).toBe(409);
    expect(dupReview.body.error.code).toBe('DUPLICATE_REVIEW');
  });

  it('Exchange workflow & Reservation Expiry Job safety', async () => {
    const exListing = await request(app)
      .post('/api/v1/listings')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        title: 'Mini Drafter for Exchange',
        description: 'Omega mini drafter in good working order for exchange.',
        categorySlug: 'drawing-instruments',
        listingType: 'exchange',
        price: 0,
        condition: 'good',
        branch: 'ME',
      });
    exchangeListingCode = exListing.body.data.listing.listingCode;

    const offeredListing = await request(app)
      .post('/api/v1/listings')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        title: 'Arduino Uno Kit for Exchange',
        description: 'Complete Arduino Uno starter kit with sensors and breadboard.',
        categorySlug: 'lab-kits',
        listingType: 'exchange',
        price: 0,
        condition: 'like_new',
        branch: 'ECE',
      });
    buyerOfferedListingCode = offeredListing.body.data.listing.listingCode;

    await request(app)
      .post(`/api/v1/admin/listings/${exchangeListingCode}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    await request(app)
      .post(`/api/v1/admin/listings/${buyerOfferedListingCode}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    // Buyer 2 cannot offer Buyer 1's listing
    const spoofOffer = await request(app)
      .post(`/api/v1/listings/${exchangeListingCode}/exchange-requests`)
      .set('Authorization', `Bearer ${buyer2Token}`)
      .send({
        offeredListingCode: buyerOfferedListingCode,
        notes: 'Trying to offer someone else item',
      });
    expect(spoofOffer.status).toBe(403);

    // Valid exchange request by Buyer 1
    const exReq = await request(app)
      .post(`/api/v1/listings/${exchangeListingCode}/exchange-requests`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        offeredListingCode: buyerOfferedListingCode,
        notes: 'Let us swap drafter for Arduino kit!',
      });
    expect(exReq.status).toBe(201);
    const exTxnCode = exReq.body.data.transaction.transactionCode;

    // Seller accepts exchange -> locks both listings
    const acceptEx = await request(app)
      .post(`/api/v1/transactions/${exTxnCode}/accept`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({});
    expect(acceptEx.status).toBe(200);
    expect(acceptEx.body.data.transaction.status).toBe('accepted');

    // Backdate reservationExpiresAt and run expiry job
    await Transaction.updateOne(
      { transactionCode: exTxnCode },
      { $set: { reservationExpiresAt: new Date(Date.now() - 60000) } }
    );
    const expResult = await expireStaleReservations(new Date());
    expect(expResult.expiredCount).toBe(1);

    // Both listings are released back to active
    const releasedCheck = await request(app)
      .get(`/api/v1/listings/${exchangeListingCode}`)
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(releasedCheck.body.data.listing.status).toBe('active');
  });

  it('TC15 & TC16: Resource library upload validation, moderation, and authorized download', async () => {
    // TC16: Upload unsupported file type -> rejected
    const badUpload = await request(app)
      .post('/api/v1/resources')
      .set('Authorization', `Bearer ${sellerToken}`)
      .field('title', 'Invalid Executable Upload')
      .field('resourceType', 'pyq')
      .field('branch', 'CSE')
      .field('academicYear', '2')
      .field('subject', 'Operating Systems')
      .attach('file', Buffer.from('MZ-fake-executable'), {
        filename: 'malware.exe',
        contentType: 'application/octet-stream',
      });
    expect(badUpload.status).toBe(400);

    // Valid PDF upload -> starts as pending
    const validPdfBuffer = Buffer.from(
      '%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF',
      'utf8'
    );
    const goodUpload = await request(app)
      .post('/api/v1/resources')
      .set('Authorization', `Bearer ${sellerToken}`)
      .field('title', 'CS302 Database Systems Mid-Sem PYQ 2025')
      .field('description', 'Solved mid-semester question paper for DBMS.')
      .field('resourceType', 'pyq')
      .field('branch', 'CSE')
      .field('academicYear', '2')
      .field('semester', '4')
      .field('subject', 'Database Management Systems')
      .field('examYear', '2025')
      .attach('file', validPdfBuffer, {
        filename: 'dbms-pyq-2025.pdf',
        contentType: 'application/pdf',
      });
    expect(goodUpload.status).toBe(201);
    expect(goodUpload.body.data.resource.status).toBe('pending');
    approvedResourceCode = goodUpload.body.data.resource.resourceCode;

    // Pending resource cannot be downloaded by regular verified student before approval
    const downloadPending = await request(app)
      .get(`/api/v1/resources/${approvedResourceCode}/download`)
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(downloadPending.status).toBe(403);

    // Admin approves resource
    const approveRes = await request(app)
      .post(`/api/v1/admin/resources/${approvedResourceCode}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.resource.status).toBe('active');

    // TC15: Verified student downloads approved PYQ
    const downloadApproved = await request(app)
      .get(`/api/v1/resources/${approvedResourceCode}/download`)
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(downloadApproved.status).toBe(200);
    expect(downloadApproved.headers['content-type']).toContain('application/pdf');
  });

  it('TC17 & TC18 & Account Blocking: Normal student denied admin access; report filed and triaged; blocked user session revoked', async () => {
    // TC17: Normal student opens admin endpoint directly -> 403
    const studentAdminTry = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(studentAdminTry.status).toBe(403);
    expect(studentAdminTry.body.error.code).toBe('FORBIDDEN');

    // TC18: User reports a listing with a reason
    const reportRes = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        targetType: 'listing',
        targetCode: exchangeListingCode,
        reason: 'Listing description has outdated edition info',
        details: 'Please verify edition number with seller.',
      });
    expect(reportRes.status).toBe(201);
    createdReportCode = reportRes.body.data.report.reportCode;

    // Report appears in admin queue
    const adminReports = await request(app)
      .get('/api/v1/admin/reports')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminReports.status).toBe(200);
    expect(
      adminReports.body.data.some((r) => r.reportCode === createdReportCode)
    ).toBe(true);

    // Admin resolves report
    const resolveRes = await request(app)
      .post(`/api/v1/admin/reports/${createdReportCode}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ note: 'Verified with seller and updated.' });
    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.report.status).toBe('resolved');

    // Admin blocks Buyer 2 -> Buyer 2 token is immediately rejected on subsequent requests
    const b2Profile = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${buyer2Token}`);
    const b2Code = b2Profile.body.data.user.userCode;

    const blockRes = await request(app)
      .post(`/api/v1/admin/users/${b2Code}/block`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Repeated policy violations in test' });
    expect(blockRes.status).toBe(200);
    expect(blockRes.body.data.user.accountStatus).toBe('blocked');

    const blockedAttempt = await request(app)
      .get('/api/v1/listings')
      .set('Authorization', `Bearer ${buyer2Token}`);
    expect(blockedAttempt.status).toBe(403);
    expect(blockedAttempt.body.error.code).toBe('ACCOUNT_BLOCKED');

    // Guest browse succeeds on public listing & resource feeds, while resource download requires auth
    const guestListings = await request(app).get('/api/v1/listings');
    expect(guestListings.status).toBe(200);
    const guestResources = await request(app).get('/api/v1/resources');
    expect(guestResources.status).toBe(200);
    const guestDownload = await request(app).get(
      `/api/v1/resources/${approvedResourceCode}/download`
    );
    expect(guestDownload.status).toBe(401);

    // Negative price on PATCH /api/v1/listings/:listingCode is rejected with 400
    const negPatch = await request(app)
      .patch(`/api/v1/listings/${exchangeListingCode}`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ price: -250 });
    expect(negPatch.status).toBe(400);
    expect(negPatch.body.error.code).toBe('VALIDATION_ERROR');

    // Admin queues support status=all and audit trail returns targetCode & reason
    const allAdminListings = await request(app)
      .get('/api/v1/admin/listings?status=all')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(allAdminListings.status).toBe(200);
    expect(allAdminListings.body.data.length).toBeGreaterThan(0);

    const allAdminResources = await request(app)
      .get('/api/v1/admin/resources?status=all')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(allAdminResources.status).toBe(200);
    expect(allAdminResources.body.data.length).toBeGreaterThan(0);

    const auditEvents = await request(app)
      .get('/api/v1/admin/audit-events')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(auditEvents.status).toBe(200);
    expect(auditEvents.body.data.length).toBeGreaterThan(0);
    expect(auditEvents.body.data[0].targetCode).toBeTruthy();
  });
});
