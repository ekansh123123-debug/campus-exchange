# Security & Trust Controls

CampusExchange implements defense-in-depth security controls aligned with `project.md` (§11, §16) and `codeinstruction.md` (§11).

## 1. Campus Identity & Verification (`FR-01`, `FR-02`)
- **College Domain Allowlist**: Registration validates emails against `COLLEGE_EMAIL_DOMAINS` (e.g., `university.ac.in,nit.ac.in,iit.ac.in,iiit.ac.in,college.edu`).
- **Verified Student Gate**: Unverified accounts (`isVerifiedStudent: false`) can sign in only to verify their email or view their profile; `requireVerifiedStudent` blocks them from creating listings, starting conversations, requesting transactions, uploading/downloading study resources, or submitting reviews/reports (`403 FORBIDDEN`).
- **Suspended Account Enforcement**: Both `authenticate` and `optionalAuthenticate` check `user.accountStatus === "active"`. Suspending a user immediately revokes all active refresh sessions (`RefreshSession.updateMany(..., { revokedAt: new Date() })`).

## 2. Authentication, Refresh Rotation & CSRF Protection
- **Short-Lived Access Token**: Signed JWT (`JWT_ACCESS_SECRET`, default `15m` expiry) sent via `Authorization: Bearer <token>`.
- **Rotating Refresh Sessions**: Stored as SHA-256 hashes (`tokenHash`) in `RefreshSession` with `familyId`, `replacedByTokenHash`, `expiresAt`, and `revokedAt`. Sent in the `ce_refresh` `HttpOnly`, `SameSite=Lax` cookie.
- **Refresh Reuse Detection**: If a previously rotated refresh token is presented again, all sessions in that `familyId` are immediately revoked.
- **Double-Submit CSRF Guard**: Cookie-authenticated endpoints (`/api/v1/auth/refresh`, `/api/v1/auth/logout`) require the `X-CSRF-Token` header to match the `ce_csrf` cookie (`csrfProtection` middleware).

## 3. Role-Based Access Control & Cross-User Isolation
- **Strict Resource Ownership**: Listings (`sellerId`), Conversations (`participantIds`), Transactions (`buyerId` / `sellerId`), and Wishlists (`userId`) enforce server-side ownership checks on every read/write operation (`TC17`, `TC18`).
- **Safe Public DTOs**: Public user endpoints and embedded seller/uploader summaries use `toPublicUserDTO`, stripping `passwordHash`, `email`, `enrollmentNumber`, and moderation internals.

## 4. File Upload Validation (`FR-04`, `FR-11`, `TC15`)
- **Listing Images**: Validated via Multer memory storage (`max 6 files`, `5 MB` per image, allowed MIME types `image/jpeg`, `image/png`, `image/webp` + extension check).
- **Study Resources / PYQs**: Restricted to `application/pdf` (`.pdf` extension, up to `20 MB`). Executable or archive extensions (`.exe`, `.bat`, `.sh`, `.js`, etc.) are rejected with `400 UNSUPPORTED_FILE_TYPE`.
- **Moderation Before Publication**: Every uploaded resource starts with `moderationStatus: "pending"` and is hidden from public search/downloads until an admin approves it (`TC14`, `TC16`).

## 5. HTTP Hardening & Rate Limiting
- **Helmet & CORS**: Configured with strict `CORS_ORIGIN` allowlist and `credentials: true`.
- **NoSQL Injection Sanitization**: `sanitizeObject` strips `$`-prefixed and dotted keys from `req.body`, `req.query`, and `req.params`.
- **Rate Limiting**: Dedicated rate limiters protect `/api/v1/auth/*` (`authRateLimiter`), write endpoints (`writeRateLimiter`), and general API routes (`apiRateLimiter`).
