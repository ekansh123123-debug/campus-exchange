# CampusExchange API Contract (`/api/v1`)

All endpoints return a consistent JSON envelope:

### Success Envelope
```json
{
  "success": true,
  "message": "Action completed successfully",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 12,
    "total": 48,
    "totalPages": 4
  }
}
```

### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "field": "price", "message": "Price is required for sale listings" }],
    "requestId": "ce-req-7d4b..."
  }
}
```

---

## 1. Health & Diagnostics
- `GET /api/v1/health/live` — Liveness probe (`status: "alive"`).
- `GET /api/v1/health/ready` — Readiness probe (`status: "ready"`, DB connection status).

## 2. Authentication & Session (`FR-01`, `FR-02`)
- `POST /api/v1/auth/register` — Register with college email (`COLLEGE_EMAIL_DOMAINS`), password, fullName, department, semester, enrollmentNumber. Issues verification token/OTP (`devVerificationCode` in development/test).
- `POST /api/v1/auth/verify-email` — Verify account with `{ email, token }`. Sets `isVerifiedStudent: true` and issues access token + `ce_refresh` (`HttpOnly`) & `ce_csrf` cookies.
- `POST /api/v1/auth/resend-verification` — Resend verification token for unverified accounts.
- `POST /api/v1/auth/login` — Authenticate user, sets `ce_refresh` (`HttpOnly`) cookie + `ce_csrf` cookie, and returns short-lived JWT `accessToken` + `csrfToken`.
- `POST /api/v1/auth/refresh` — Rotate refresh session token (`ce_refresh` cookie + `X-CSRF-Token` header) with replay detection.
- `POST /api/v1/auth/logout` — Revoke current refresh session and clear cookies.
- `POST /api/v1/auth/logout-all` — Revoke all refresh sessions for the authenticated user.
- `GET /api/v1/auth/me` — Get current authenticated user profile (`PrivateSelfUserDTO`).

## 3. Users & Profile (`FR-03`)
- `PATCH /api/v1/users/me` — Update own profile (`fullName`, `department`, `semester`, `bio`, `avatarUrl`).
- `GET /api/v1/users/:userId/public` — Safe public profile (`PublicUserDTO`: `id`, `fullName`, `department`, `semester`, `bio`, `avatarUrl`, `isVerifiedStudent`, `averageRating`, `reviewCount`, `joinedAt`) + public active listings + seller reviews.

## 4. Categories (`FR-05`)
- `GET /api/v1/categories` — List active categories (`slug`, `name`, `description`, `allowedCourseCodes`).
- `POST /api/v1/categories` — Create category (`admin` only).
- `PATCH /api/v1/categories/:categoryId` — Update category (`admin` only).

## 5. Listings (`FR-04`, `FR-05`, `FR-06`)
- `GET /api/v1/listings` — Paginated marketplace discovery with filters: `q`, `category`, `semester`, `department`, `courseCode`, `subject`, `academicYear`, `condition`, `listingType` (`sell`/`donate`/`exchange`), `minPrice`, `maxPrice`, `status`, `sort` (`newest`, `price_asc`, `price_desc`). Supports optional auth (`isWishlisted`).
- `GET /api/v1/listings/mine` — Authenticated seller's own listings across all statuses.
- `GET /api/v1/listings/:listingCode` — Detailed listing view (`LST-XXXXXX`) with safe seller summary and related listings.
- `POST /api/v1/listings` — Create listing (`multipart/form-data`, up to 6 images, 5 MB each, verified student required). Enforces `price: 0` when `listingType === "donate"`.
- `PATCH /api/v1/listings/:listingCode` — Update listing fields (owner or admin only; blocked once `completed`).
- `PATCH /api/v1/listings/:listingCode/status` — Update status (`active`, `paused`, `archived`).
- `DELETE /api/v1/listings/:listingCode` — Soft-archive listing (owner or admin only).

## 6. Wishlist (`FR-09`)
- `GET /api/v1/wishlist` — List saved listings for the authenticated verified student.
- `POST /api/v1/wishlist/:listingCode` — Add listing to wishlist (idempotent).
- `DELETE /api/v1/wishlist/:listingCode` — Remove listing from wishlist.

## 7. Conversations & Messaging (`FR-07`)
- `GET /api/v1/conversations` — List user's conversations ordered by `lastMessageAt`.
- `POST /api/v1/conversations` — Start or retrieve existing thread for `{ listingCode, initialMessage }`.
- `GET /api/v1/conversations/:conversationId/messages` — List messages in thread (strict participant check).
- `POST /api/v1/conversations/:conversationId/messages` — Send message (`body` up to 2000 chars) and notify recipient.
- `POST /api/v1/conversations/:conversationId/read` — Mark unread messages in thread as read.

## 8. Transactions & Handover (`FR-08`)
- `POST /api/v1/transactions` — Request reservation (`{ listingCode, offeredPrice, proposedMeetupNote }`). Prevents self-reservation and duplicate active requests.
- `GET /api/v1/transactions` — List transactions (`?role=buyer|seller|all`).
- `GET /api/v1/transactions/:transactionCode` — Inspect transaction (`TXN-XXXXXX`) with state transition logs.
- `PATCH /api/v1/transactions/:transactionCode/status` — Transition transaction state (`accepted`, `declined`, `cancelled`, `completed`, `disputed`):
  - Accepting a request atomically transitions the listing from `active` to `reserved` (`findOneAndUpdate({ _id, status: "active" })`) and auto-declines competing `requested` transactions.
  - Declining or cancelling a `reserved` transaction restores the listing back to `active`.
  - Completing an `accepted` transaction marks the listing `completed`.

## 9. Seller Reviews (`FR-10`)
- `POST /api/v1/reviews` — Submit 1–5 star review + comment for a `completed` transaction (`{ transactionCode, rating, comment }`). Enforces one review per transaction and updates seller's `averageRating` & `reviewCount`.
- `GET /api/v1/reviews/seller/:sellerId` — List public reviews for a seller.

## 10. PYQ & Study Resource Library (`FR-11`, `FR-12`)
- `GET /api/v1/resources` — Browse `approved` resources (or `scope=mine` for uploader's own pending/approved/rejected uploads). Supports filters: `q`, `department`, `semester`, `courseCode`, `subject`, `resourceType` (`pyq`, `notes`, `syllabus`, `lab_manual`), `examType` (`mid_sem`, `end_sem`, `quiz`, `assignment`, `other`), `academicYear`.
- `GET /api/v1/resources/:resourceCode` — Resource detail (`RES-XXXXXX`). Non-approved resources are visible only to their uploader or an admin.
- `POST /api/v1/resources` — Upload study resource (`multipart/form-data`, PDF up to 20 MB, verified student required). Defaults to `moderationStatus: "pending"`.
- `POST /api/v1/resources/:resourceCode/download` — Verified student download endpoint; increments `downloadCount` and returns `{ downloadUrl, fileName }`.

## 11. Reports & Moderation (`FR-13`, `FR-14`)
- `POST /api/v1/reports` — Report a listing, resource, user, or message (`{ targetType, targetCode, reasonCategory, description }`).
- `GET /api/v1/admin/overview` — Admin KPI metrics (`admin` only).
- `GET /api/v1/admin/resources/queue` — Resource moderation queue (`?status=pending|approved|rejected|all`).
- `PATCH /api/v1/admin/resources/:resourceCode/moderation` — Approve or reject a resource (`{ moderationStatus, rejectionReason }`), writes `AuditEvent` and notifies uploader.
- `GET /api/v1/admin/reports` — List moderation reports (`?status=open|in_review|resolved|dismissed|all`).
- `PATCH /api/v1/admin/reports/:reportCode` — Resolve/dismiss report with optional target enforcement (`suspend_user`, `hide_listing`, `remove_resource`, `none`).
- `PATCH /api/v1/admin/users/:userId/status` — Suspend or reactivate user (`accountStatus: "active" | "suspended"`), revoking all refresh sessions on suspension.
- `GET /api/v1/admin/audit-logs` — List immutable admin `AuditEvent` records.

## 12. Notifications (`FR-15`)
- `GET /api/v1/notifications` — List in-app notifications + `unreadCount`.
- `PATCH /api/v1/notifications/:notificationId/read` — Mark single notification as read.
- `POST /api/v1/notifications/read-all` — Mark all notifications as read.
