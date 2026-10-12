# CampusExchange — Implementation and Code Instructions

**Purpose:** This document is the implementation contract for an AI coding agent or development team. Follow it together with `project.md`. It defines the required architecture, file organization, authentication and authorization rules, API contracts, database behaviour, UI expectations, tooling policy, and verification gates.

## 0. Mandatory Rules

1. **Read `project.md` first.** It defines the source-derived requirements, accepted workflows, test cases, risk register, and definition of done.
2. **Inspect the current repository before changing anything.** Preserve working code and existing conventions unless there is a clear reason to refactor. Do not overwrite existing user work without inspection.
3. **Use the requested stack:** Vite + React for the frontend; Node.js + Express.js for the backend; MongoDB + Mongoose for persistence. Do not silently revert to Flask, MySQL, another frontend framework, or an in-memory-only mock.
4. **Use modular JavaScript with ES modules** (`import`/`export`) unless the existing repo or project owner explicitly chooses TypeScript. Keep client files as `.jsx` where JSX is used.
5. **Build complete vertical features.** A feature is not complete when the page merely looks finished: its API, validation, database persistence, authorization, loading/empty/error states, and tests must work.
6. **No fake success.** Do not add buttons that do nothing, hard-code counts that look live, simulate persistent data in local storage, or display a success notification when the API failed. Clearly mark seed/demo data.
7. **Server-side security is authoritative.** React route guards are a usability feature, never the access-control boundary.
8. **Enforce cross-user isolation.** Every user-owned object is accessed through an authenticated actor and a scoped database query/service check. Guessing another user's code or ObjectId must not expose or mutate their data.
9. **Never expose secrets or sensitive fields.** No `.env` secrets in source control, client bundles, API responses, logs, committed test fixtures, screenshots, or documentation.
10. **Use available skills and MCP/tooling responsibly.** Inspect the available skills and MCPs in the coding environment. Use a relevant UI/design skill for the React interface, a testing/browser skill for validating workflows, and available official documentation/search tools for uncertain APIs. Do not invent tool names, claim a tool was used if it was not available, or let an MCP response override this specification or security requirements. Human approval is required for any tool that asks to authorize an external side effect.
11. **Keep docs in sync.** Update README setup steps, `.env.example`, API documentation, and test instructions whenever implementation changes them.
12. **Verify before declaring completion.** Run lint, tests, build, and a practical end-to-end smoke test. Report actual outcomes and remaining limitations honestly.

## 1. Technical Stack and Dependency Policy

### 1.1 Required stack

- **Frontend:** Vite, React, React Router, JavaScript/JSX, responsive CSS/component system.
- **Client data:** Prefer TanStack Query for server state and a single shared API client. Use local component state for transient UI state. Do not duplicate server data into multiple global stores without a reason.
- **Backend:** Node.js, Express.js 5, ES modules.
- **Database:** MongoDB with Mongoose.
- **Authentication:** `bcryptjs`, `jsonwebtoken`, `cookie-parser`, server-side refresh-session records.
- **Media:** `@imagekit/nodejs`, `multer`.
- **Environment:** `dotenv` in local development; production deployment must supply environment variables through its secret-management system.
- **Email:** An SMTP/email-provider adapter, e.g. `nodemailer`, with a development mail sink or console-safe local option. Never print real OTPs in production logs.
- **Chat/realtime:** Persisted REST chat is mandatory. Socket.IO and its React client can be added for realtime updates, but must use identical authentication and participant authorization.
- **Validation:** Use `zod` or another single, consistently applied schema validator for API request shapes. Avoid hand-written, inconsistent validation in every controller.

### 1.2 User-provided dependencies

Use these as the initial requested dependencies, verifying installability and compatibility during setup:

```json
{
  "@imagekit/nodejs": "^7.12.1",
  "bcryptjs": "^3.0.3",
  "cookie-parser": "^1.4.7",
  "dotenv": "^18.0.7",
  "express": "^5.3.0",
  "jsonwebtoken": "^9.0.3",
  "mongoose": "^9.11.1",
  "multer": "^2.4.0"
}
```

**Important package-name correction:** use **`cookie-parser`**, not `cookies-parser`. The requested spelling `cookies-parser` is not the standard package used by Express to populate `req.cookies`; the implementation must not install/import it by mistake. Check the npm package and lockfile before finalizing versions.

### 1.3 Additional recommended server dependencies

Add only what the implementation uses:

- `helmet` — security-related HTTP headers.
- `cors` — exact-origin CORS rules.
- `express-rate-limit` — endpoint-specific request throttling.
- `zod` — request/environment validation.
- `pino` and `pino-http` — structured logging with redaction.
- `nodemailer` or a provider-specific SDK — email verification and password recovery.
- `socket.io` — optional realtime chat/notifications.
- `file-type` — inspect file signatures instead of trusting upload MIME metadata.
- `sharp` — optional server-side image normalization/processing.
- `sanitize-html` — only if rich-text HTML is accepted; prefer plain-text messages/reviews.
- `supertest` — API integration tests.
- `vitest` — unit/integration test runner.
- `mongodb-memory-server` with replica-set support, or a disposable test MongoDB replica set — integration tests involving MongoDB transactions.
- `eslint`, `prettier` — consistent code quality.

### 1.4 Additional recommended client dependencies

- `react-router-dom` — routing.
- `@tanstack/react-query` — asynchronous server state, caching, invalidation, and loading/error handling.
- `react-hook-form` + `zod` + `@hookform/resolvers` — consistent client form handling; repeat validation on the server.
- `lucide-react` — consistent icons.
- `socket.io-client` — only if Socket.IO is implemented.
- `vitest`, `@testing-library/react`, `@testing-library/user-event`, and `@testing-library/jest-dom` — component tests.
- `@playwright/test` — end-to-end browser tests if supported in the environment.

Use a single styling approach. Preferred default: Tailwind CSS plus accessible component primitives, or well-organized CSS Modules if the repo already uses them. Do not combine several UI kits without a clear reason. Avoid heavy visual libraries when simple accessible components work.

### 1.5 Dependency installation rules

- First inspect existing `package.json` files and lockfiles.
- Install compatible stable releases; do not blindly paste versions that are incompatible with the available Node.js runtime.
- Keep the lockfile committed and reproducible.
- Use the correct dependency section (`dependencies` vs `devDependencies`).
- Do not install redundant libraries that duplicate the same purpose.
- Run the app, lint, and tests immediately after dependency installation; resolve peer dependency/build failures rather than ignoring them.

## 2. Repository and File Structure

Use a small monorepo with separate client/server packages. Adapt paths only if a repository already has a good equivalent; preserve clear feature boundaries.

```text
campus-exchange/
├── project.md
├── codeinstruction.md
├── README.md
├── package.json                  # root scripts/workspaces if desired
├── package-lock.json
├── .gitignore
├── .editorconfig
├── .env.example                  # safe documentation only; no secret values
├── docs/
│   ├── api.md
│   ├── data-model.md
│   ├── security.md
│   ├── testing.md
│   └── operations.md
├── client/
│   ├── package.json
│   ├── index.html
│   ├── vite.config.js
│   ├── public/
│   └── src/
│       ├── main.jsx
│       ├── app/
│       │   ├── App.jsx
│       │   ├── router.jsx
│       │   ├── providers.jsx
│       │   └── route-guards.jsx
│       ├── assets/
│       ├── components/
│       │   ├── layout/            # app shell, nav, footer, page containers
│       │   ├── ui/                # buttons, inputs, badges, dialogs, tables
│       │   └── feedback/          # loading, empty, error, toast, confirm UI
│       ├── features/
│       │   ├── auth/
│       │   ├── dashboard/
│       │   ├── listings/
│       │   ├── marketplace/
│       │   ├── wishlist/
│       │   ├── conversations/
│       │   ├── transactions/
│       │   ├── resources/
│       │   ├── profile/
│       │   ├── notifications/
│       │   ├── reports/
│       │   └── admin/
│       ├── hooks/
│       ├── lib/
│       │   ├── api-client.js
│       │   ├── query-client.js
│       │   ├── formatters.js
│       │   └── constants.js
│       ├── styles/
│       └── test/
└── server/
    ├── package.json
    ├── .env.example                # safe duplicate if server is run independently
    ├── src/
    │   ├── app.js                  # create/configure Express app; no listen side effect
    │   ├── server.js               # connect DB, initialize sockets, listen, graceful shutdown
    │   ├── config/
    │   │   ├── env.js
    │   │   ├── database.js
    │   │   ├── cors.js
    │   │   ├── imagekit.js
    │   │   ├── mail.js
    │   │   └── logger.js
    │   ├── constants/
    │   │   ├── roles.js
    │   │   ├── account-status.js
    │   │   ├── listing-status.js
    │   │   ├── transaction-status.js
    │   │   ├── resource-status.js
    │   │   └── upload-limits.js
    │   ├── middleware/
    │   │   ├── authenticate.js
    │   │   ├── require-role.js
    │   │   ├── require-verified-student.js
    │   │   ├── require-active-account.js
    │   │   ├── validate-request.js
    │   │   ├── request-id.js
    │   │   ├── rate-limits.js
    │   │   ├── upload.js
    │   │   ├── not-found.js
    │   │   └── error-handler.js
    │   ├── models/
    │   │   ├── User.model.js
    │   │   ├── EmailVerification.model.js
    │   │   ├── RefreshSession.model.js
    │   │   ├── Category.model.js
    │   │   ├── Listing.model.js
    │   │   ├── Resource.model.js
    │   │   ├── Conversation.model.js
    │   │   ├── Message.model.js
    │   │   ├── Transaction.model.js
    │   │   ├── Wishlist.model.js
    │   │   ├── Review.model.js
    │   │   ├── Report.model.js
    │   │   ├── Notification.model.js
    │   │   └── AuditEvent.model.js
    │   ├── modules/
    │   │   ├── auth/
    │   │   ├── users/
    │   │   ├── categories/
    │   │   ├── listings/
    │   │   ├── wishlist/
    │   │   ├── conversations/
    │   │   ├── messages/
    │   │   ├── transactions/
    │   │   ├── reviews/
    │   │   ├── resources/
    │   │   ├── reports/
    │   │   ├── notifications/
    │   │   └── admin/
    │   ├── services/
    │   │   ├── token.service.js
    │   │   ├── email.service.js
    │   │   ├── media.service.js
    │   │   ├── notification.service.js
    │   │   ├── audit.service.js
    │   │   └── public-id.service.js
    │   ├── sockets/
    │   │   ├── index.js
    │   │   └── authorization.js
    │   ├── jobs/
    │   │   └── expire-reservations.job.js
    │   ├── utils/
    │   │   ├── async-handler.js
    │   │   ├── app-error.js
    │   │   ├── api-response.js
    │   │   ├── pagination.js
    │   │   └── safe-user.js
    │   ├── scripts/
    │   │   ├── seed-categories.js
    │   │   ├── seed-demo-data.js
    │   │   └── create-admin.js
    │   └── tests/
    │       ├── unit/
    │       ├── integration/
    │       └── helpers/
    └── uploads/                    # only if a temporary local staging directory is needed; gitignored
```

### 2.1 Module conventions

Each feature module should keep its HTTP adapter separate from its business logic. A conventional module contains:

```text
feature/
├── feature.routes.js       # route paths and middleware composition
├── feature.controller.js   # request/response mapping; no complex business rules
├── feature.service.js      # business rules, permissions, transactions
├── feature.validation.js   # request schemas
└── feature.test.js         # tests or a corresponding tests/ folder
```

Do not create every file merely to satisfy a template if it stays empty. Use the separation consistently for implemented features. Do not put the entire application into `server.js`, a single React component, or a giant route file.

## 3. Environment and Startup Configuration

### 3.1 Required environment variables

Create `.env.example` with placeholders/comments only. At minimum:

```dotenv
NODE_ENV=development
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
API_BASE_URL=http://localhost:5000/api/v1
MONGODB_URI=mongodb://127.0.0.1:27017/campus_exchange

COLLEGE_EMAIL_DOMAINS=example.edu
JWT_ACCESS_SECRET=replace-with-long-random-secret
JWT_REFRESH_SECRET=replace-with-a-different-long-random-secret
JWT_ACCESS_TTL=10m
JWT_REFRESH_TTL_DAYS=14
JWT_ISSUER=campus-exchange-api
JWT_AUDIENCE=campus-exchange-client
COOKIE_SECURE=false
COOKIE_SAME_SITE=strict

EMAIL_FROM=CampusExchange <no-reply@example.edu>
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=

IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=
IMAGEKIT_RESOURCE_FOLDER=/campus-exchange/resources
IMAGEKIT_LISTING_FOLDER=/campus-exchange/listings

MAX_LISTING_IMAGES=6
MAX_IMAGE_SIZE_MB=5
MAX_RESOURCE_SIZE_MB=20
ACCESS_TOKEN_COOKIE_NAME=   # access token should normally be returned only in memory/client Authorization header
REFRESH_COOKIE_NAME=ce_refresh
CSRF_COOKIE_NAME=ce_csrf
LOG_LEVEL=info
```

The sample college domain is illustrative; do not ship `example.edu` as the production domain. An empty SMTP configuration may be allowed only in local development with a documented mail sink/preview mechanism. Production startup should fail fast if mandatory secrets/provider configuration is missing.

### 3.2 Environment validation

- Validate `process.env` once in `config/env.js` at startup.
- Parse port, boolean, enum, domain allowlist, token TTL, upload limits, and origin values into typed/normalized settings.
- Fail fast with a clear message if required settings are absent or malformed; never log actual secret values.
- Separate development, test, and production settings. Test mode must not use production databases or real email providers.

### 3.3 Server boot sequence

1. Load environment configuration.
2. Initialize structured logger and redaction rules.
3. Connect to MongoDB and confirm readiness.
4. Register indexes/model initialization as required.
5. Create Express app with security, CORS, parsing, cookies, request ID, and routes.
6. Attach Socket.IO if enabled and configure authenticated handlers.
7. Start reservation-expiry scheduler only once per intended worker/deployment (avoid duplicate schedulers across replicas; use a proper job system or leader/single-worker strategy if scaled).
8. Start listening.
9. On termination, stop accepting new requests, close Socket.IO, finish/stop jobs, close the server, and disconnect Mongoose gracefully.

Keep `app.js` exportable for tests without opening a network listener. Keep startup/listen side effects in `server.js`.

## 4. API Design Conventions

### 4.1 Base URL and request format

- Base path: `/api/v1`.
- Use JSON for normal operations and `multipart/form-data` only for uploads.
- Use ISO 8601 UTC timestamps in responses.
- Use MongoDB `ObjectId` internally; use public codes such as `CEU-...` and `CEL-...` in user-facing URLs when appropriate.
- Keep response shapes predictable.

Successful single-record response:

```json
{
  "success": true,
  "data": { "id": "..." }
}
```

Paginated response:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

Error response:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the highlighted fields.",
    "details": [],
    "requestId": "..."
  }
}
```

The error format must not include stack traces, raw MongoDB errors, secrets, token claims that expose sensitive data, or provider responses that contain credentials.

### 4.2 HTTP status choices

- `200 OK`: successful read/update/action with a response.
- `201 Created`: resource created.
- `204 No Content`: successful deletion/logout only where no response body is needed.
- `400 Bad Request`: malformed JSON or invalid request shape (or `422` consistently for semantic validation; choose one convention and document it).
- `401 Unauthorized`: missing/invalid/expired authentication.
- `403 Forbidden`: authenticated user lacks permission, is unverified, or is blocked (consider using a consistent product policy).
- `404 Not Found`: target does not exist or should not be disclosed to this actor.
- `409 Conflict`: stale state, duplicate action, item no longer available, or transaction race.
- `413 Payload Too Large`: upload/body over limit.
- `429 Too Many Requests`: rate limit reached.
- `500 Internal Server Error`: unexpected failure with a generic message and request ID.
- `503 Service Unavailable`: required dependency unavailable where applicable.

### 4.3 Pagination

- Accept bounded `page` and `limit`, default `page=1`, `limit=20` and a documented maximum (for example 100).
- Reject or normalize invalid negative/oversized values.
- Prefer stable sorting with a unique tie-breaker such as `_id`/created timestamp.
- Do not return every row by default.

### 4.4 Validation boundary

- Validate `params`, `query`, and `body` independently at the route boundary.
- Unknown properties should be stripped or rejected, especially fields that could change identity, role, status, or ownership.
- Convert only allowlisted query strings to typed values.
- Never pass `req.query` directly into a Mongoose query, `$where`, sort object, or aggregation stage.
- Avoid echoing raw input values in errors if they may contain sensitive data.

## 5. API Route Contract

All route handlers must call service functions and return the documented response envelope. Exact payload names may be standardized during implementation, but do not omit these capabilities.

### 5.1 Authentication — `/auth`

| Method | Path | Access | Behaviour |
|---|---|---|---|
| POST | `/auth/register` | Public, rate-limited | Validate college email and fields; create unverified student; send OTP/link. |
| POST | `/auth/verify-email` | Public, rate-limited | Verify token/OTP with expiry/attempt checks; mark account email verified. |
| POST | `/auth/resend-verification` | Public, rate-limited | Invalidate/rotate previous verification token and resend after cooldown. |
| POST | `/auth/login` | Public, rate-limited | Validate password; reject blocked/unverified states according to policy; issue access token and refresh cookie. |
| POST | `/auth/refresh` | Refresh cookie + CSRF/origin checks | Rotate refresh session and issue new access token; reject reuse/revoked/expired sessions. |
| POST | `/auth/logout` | Refresh/access session as applicable + CSRF checks | Revoke current refresh session and clear cookies. |
| GET | `/auth/me` | Authenticated | Return safe current-user representation. |
| POST | `/auth/forgot-password` | Public, rate-limited | Send a generic response regardless of account existence. |
| POST | `/auth/reset-password` | Public, token-limited | Validate one-time reset token, change hash, revoke refresh sessions. |

Registration request should include only editable student fields. Ignore/reject `role`, `isVerified`, `accountStatus`, `userCode`, `sellerId`, and all other server-controlled fields. Do not provide public admin registration.

### 5.2 Users — `/users`

- `GET /users/me`: current safe profile.
- `PATCH /users/me`: update only allowed profile fields.
- `GET /users/:userCode`: safe public profile; hide email, phone/contact details, session data, internal moderation notes, and all secret fields.
- If profile photo upload is supported, use the same upload security rules as other media.

### 5.3 Categories — `/categories`

- `GET /categories`: active listing categories for student forms/filters.
- Admin create/update/disable category routes only if category management is required for the MVP; otherwise seed controlled categories.

### 5.4 Listings — `/listings`

- `GET /listings`: public-to-verified-user search endpoint; requires validated filters, pagination, stable sort, and active-status filter.
- `POST /listings`: verified student; create as `pending`; seller ID is derived from the authenticated actor.
- `GET /listings/:listingCode`: listing details plus only safe seller summary.
- `PATCH /listings/:listingCode`: owner-only update; do not allow arbitrary status/moderation changes. For changes to important listing fields, require resubmission/moderation as defined by policy.
- `DELETE /listings/:listingCode`: owner can remove only in allowed states. Prefer soft removal/status transitions over destructive deletion when history/audit is needed.
- `POST /listings/:listingCode/submit`: submit/re-submit a draft/rejected listing for moderation.
- `POST /listings/:listingCode/wishlist`: add to current user's wishlist (or use a dedicated wishlist route, but choose one contract).
- `POST /listings/:listingCode/reservations`: reserve an active sale listing and create a transaction in a concurrency-safe operation.
- `POST /listings/:listingCode/exchange-requests`: create an exchange request, with an optional `offeredListingCode` that must be active and owned by the requester.
- Admin moderation should use the `/admin` namespace rather than trusting listing-owner routes.

Suggested query fields: `q`, `category`, `branch`, `year`, `semester`, `subject`, `minPrice`, `maxPrice`, `condition`, `listingType`, `sort`, `page`, `limit`. Only documented values are accepted.

### 5.5 Wishlist — `/wishlist`

- `GET /wishlist`: current user's saved listings only.
- `POST /wishlist`: add a `listingCode`/listing reference to the current user's wishlist, or implement the dedicated listing action above.
- `DELETE /wishlist/:listingCode`: remove only the current user's entry.
- Prevent duplicates with a compound unique database index.

Choose one add API path and use it consistently across client, docs, and tests; do not maintain two implementations with different rules.

### 5.6 Conversations and messages

- `GET /conversations`: only conversations in which the authenticated user is a participant.
- `POST /conversations`: create/open a conversation for an allowed listing; enforce buyer != seller and derive seller from listing. Prevent duplicate conversation records for the same listing/buyer/seller combination.
- `GET /conversations/:conversationCode/messages`: verify participant membership before reading paginated history.
- `POST /conversations/:conversationCode/messages`: verify participant membership, account state, message constraints, and rate limit; persist message and notification before attempting real-time emission.
- `PATCH /conversations/:conversationCode/read`: mark relevant incoming messages as read for the current participant only.

If a conversation must stay open after an item is sold, define the policy; do not accidentally allow a new unrelated buyer to access an old private conversation.

### 5.7 Transactions

- `GET /transactions`: current user's transactions as buyer or seller only.
- `GET /transactions/:transactionCode`: participants (and authorized admin) only.
- `POST /transactions/:transactionCode/accept`: seller accepts a pending exchange request.
- `POST /transactions/:transactionCode/decline`: seller declines a pending exchange request.
- `POST /transactions/:transactionCode/cancel`: participant cancellation only when the state/policy permits it.
- `POST /transactions/:transactionCode/confirm-handover`: seller confirms allowed reserved/accepted transaction handover.
- A protected internal/job service expires reservations, moves transaction state to expired/cancelled, and releases a listing only if it is still reserved by that transaction.
- Sale reservation is initiated by the listing reservation endpoint; it must not be possible to create an arbitrary transaction state through a user-provided body.

### 5.8 Reviews

- `POST /transactions/:transactionCode/reviews`: current transaction participant submits a 1–5 review of the other participant after completion.
- `GET /users/:userCode/reviews`: paginated safe reviews for a public profile.
- Prevent duplicate author/transaction pairs with both service validation and a unique index.
- Validate and limit comment length; do not render review text as unsanitized HTML.

### 5.9 Resources

- `GET /resources`: verified student; return approved resources using filters/search/pagination.
- `GET /resources/:resourceCode`: approved resource metadata safe for the current user.
- `POST /resources`: verified student, multipart upload; save as pending after storage succeeds and metadata validates.
- `GET /resources/:resourceCode/download`: verify account status, verification, resource approval, and download access; then serve or sign a short-lived provider URL.
- `GET /resources/mine`: current user's uploads and moderation state.

### 5.10 Reports

- `POST /reports`: verified student reports a listing/user/resource (and optional supported target type); validate reason/details and limit frequency.
- `GET /reports/mine`: optional own-submitted reports view if included in the UI; disclose only appropriate fields.
- Admin queue/action routes live under `/admin/reports`.

### 5.11 Notifications

- `GET /notifications`: current user's paginated notifications.
- `GET /notifications/unread-count`: count for current user.
- `PATCH /notifications/:notificationCode/read`: mark only that user's notification as read.
- `PATCH /notifications/read-all`: mark current user's notifications as read.

### 5.12 Administration — `/admin`

Every endpoint requires an active administrator role on the server:

- `GET /admin/dashboard`: live aggregate metrics.
- `GET /admin/listings?status=pending`: moderation queue.
- `POST /admin/listings/:listingCode/approve`: record admin and timestamp, transition only an eligible pending listing to active.
- `POST /admin/listings/:listingCode/reject`: require rejection reason and record decision.
- `GET /admin/resources?status=pending`: resource moderation queue.
- `POST /admin/resources/:resourceCode/approve` and `/reject`: moderation actions with audit record/reason.
- `POST /admin/resources/:resourceCode/takedown`: revoke resource availability and record a reason.
- `GET /admin/users`: paginated user list with safe filters and redacted sensitive fields.
- `POST /admin/users/:userCode/block` and `/restore`: require reason; revoke refresh sessions on block.
- `GET /admin/reports`: report queue.
- `POST /admin/reports/:reportCode/assign`, `/resolve`, `/dismiss`: validate state transition and audit action.
- `GET /admin/audit-events`: admin-only safe audit history.

Do not rely on the React admin menu being hidden. Add route middleware and service-level permission checks for every admin operation.

## 6. Data Model Implementation

### 6.1 User model

Recommended fields:

```text
_id: ObjectId
userCode: string, unique, immutable
fullName: string, trimmed, length bounded
collegeEmail: string, lowercase/trimmed, unique
passwordHash: string, select:false
role: 'student' | 'admin'
emailVerifiedAt: Date | null
accountStatus: 'active' | 'blocked' | 'deleted'
branch: string/controlled enum
academicYear: configured enum/value
bio: string, optional, length bounded
avatar: { provider, fileId, url } optional
contactPreferences: enum/object; private
ratingAverage: number, computed/maintained
ratingCount: number
createdAt / updatedAt
blockedAt, blockedBy, blockReason: nullable/admin-controlled
```

- Internal model field names may vary slightly if documented, but keep a stable public DTO that omits `passwordHash`, email where not necessary, verification tokens, sessions, private contact data, and admin notes.
- Normalize email before the unique index. Handle duplicate-key conflicts as a friendly `409` rather than a `500`.
- Never use the client's `role` or `accountStatus` values during registration/profile updates.

### 6.2 Public code generation

- Generate identifiers with the `crypto` module or another cryptographically secure generator.
- Prefix by entity (`CEU`, `CEL`, `CET`, `CER`, `CERPT`, `CEC`) and add a random suffix with adequate entropy.
- Enforce unique indexes in MongoDB; if a rare collision occurs, retry a small, bounded number of times.
- Generate identifiers in trusted server code only; clients may read but never write them.
- Do not use predictable incremental IDs, names, emails, branches, or other personal information as code components.

### 6.3 Listing model

Recommended fields:

```text
_id: ObjectId
listingCode: string, unique, immutable
sellerId: ObjectId ref User, immutable owner
categoryId: ObjectId ref Category
title: string, required, bounded
titleNormalized: string
 description: string, required, bounded
listingType: 'sell' | 'exchange'
pricePaise: integer >= 0 (required for MVP to match TC06; display as INR)
condition: 'new' | 'like_new' | 'good' | 'fair' | 'for_parts'
images: [{ provider, fileId, url, thumbnailUrl, altText }]
branch, academicYear, semester, subject: optional bounded metadata
status: 'draft' | 'pending' | 'active' | 'reserved' | 'sold' | 'rejected' | 'removed'
reservedTransactionId: ObjectId ref Transaction | null
moderation: { submittedAt, reviewedAt, reviewedBy, rejectionReason }
removedAt, removedBy, removalReason
createdAt / updatedAt
```

Use one enum mapping in constants and one label mapping in the client. Do not let general update endpoints accept `status`, `reservedTransactionId`, or moderation fields.

### 6.4 Resource model

Include `resourceCode`, `uploaderId`, title, description, `resourceType`, branch, academic year, semester, subject, file metadata (provider, file ID, safe file name, detected MIME type, byte size, checksum if practical), status (`pending`, `active`, `rejected`, `removed`), moderator/rejection/takedown details, download count, and timestamps. Do not store private file bytes directly inside MongoDB documents.

### 6.5 Conversation and Message models

- Conversation: public code, listing ID, buyer ID, seller ID, last-message timestamp, closed/archived state, created/updated timestamps.
- Message: conversation ID, sender ID, plain-text body with a bounded length, created timestamp, read state/receipts, optional soft-deletion/moderation metadata.
- Add indexes for conversation participants and message history (`conversationId`, created timestamp).
- Use a compound uniqueness rule to avoid duplicate conversations for the same listing/buyer pair where appropriate. Handle races through the unique index.

### 6.6 Transaction model

Recommended fields:

```text
_id, transactionCode (unique)
listingId: ObjectId ref Listing
buyerId: ObjectId ref User
sellerId: ObjectId ref User
txnType: 'sale' | 'exchange'
offeredListingId: ObjectId ref Listing | null
status: 'reserved' | 'pending_exchange' | 'accepted' | 'declined' | 'cancelled' | 'expired' | 'completed' | 'disputed'
reservationExpiresAt: Date | null
acceptedAt, cancelledAt, completedAt, handoverConfirmedAt: Date | null
cancelledBy: ObjectId | null
reason/notes: bounded, policy-limited
createdAt / updatedAt
```

Adjust names to avoid ambiguous overlapping listing/transaction state terms, but keep one explicit mapping in constants/docs/UI. For sale, record is created in reserved state after winning the atomic listing update. For exchange, it begins pending, and is accepted/reserved only after the seller approves and involved items can be locked.

### 6.7 Remaining records

- **EmailVerification:** user ID, purpose, token/OTP hash, expiry, attempt count, resend availability, consumed timestamp; TTL index if using document expiry, plus explicit expiry checks in logic.
- **RefreshSession:** user ID, token hash or token ID, session ID, expiry, revoked/replaced fields, created time, user agent/IP metadata only as needed and per privacy policy.
- **Wishlist:** user ID, listing ID, saved time; unique compound index.
- **Review:** transaction ID, author ID, target user ID, rating, comment, moderation state, timestamps; unique `{ transactionId, authorId }` index.
- **Report:** report code, reporter ID, target type/ID/code, reason, detail, status, assigned/resolved admin, resolution note, timestamps.
- **Notification:** notification code, user ID, event type, title/body, safe in-app link identifier, read timestamp, created timestamp.
- **AuditEvent:** actor ID/role, action, target type/ID, safe metadata, request ID, timestamp; redact tokens and sensitive fields.

### 6.8 MongoDB indexes

Create and document indexes, at minimum:

- `User.collegeEmail` unique.
- Public codes (`userCode`, `listingCode`, `resourceCode`, `transactionCode`, `conversationCode`, `reportCode`, notification code) unique.
- Listings: `{ status: 1, createdAt: -1 }`, `{ status: 1, categoryId: 1, createdAt: -1 }`, common academic filters as justified, and text/search indexes for title/description or the chosen search strategy.
- Messages: `{ conversationId: 1, createdAt: -1 }`.
- Conversations: participant/listing search index and the chosen unique combination.
- Wishlist: `{ userId: 1, listingId: 1 }` unique.
- Reviews: `{ transactionId: 1, authorId: 1 }` unique and `{ targetUserId: 1, createdAt: -1 }`.
- Resource moderation: `{ status: 1, createdAt: -1 }`; library search indexes based on the chosen filter strategy.
- Expiring token/session fields: TTL indexes where useful; still check expiry in service code because TTL deletion is asynchronous.

Do not add many arbitrary indexes without considering write costs. Document why each non-obvious index exists.

## 7. Authentication and Session Implementation

### 7.1 Register and verify

1. Validate all fields with the request schema.
2. Normalize email; verify its domain against the server allowlist.
3. Validate password length and reject problematic bcryptjs lengths as required by the library; do not silently truncate credentials.
4. Hash password using asynchronous bcryptjs APIs and a reviewed work factor.
5. Create a student with unverified email and active/pending status according to the chosen account schema.
6. Generate a cryptographically secure OTP or long random verification token. Store only a hash with purpose, expiry, attempts, and consumed fields.
7. Send mail using the email service abstraction.
8. On correct verification, atomically consume the still-valid token and set `emailVerifiedAt`.
9. Make verification idempotent only according to a documented policy; a used token must not verify another account or be reusable.
10. Never log the actual OTP or reset token outside an explicitly isolated local mail-preview mechanism.

### 7.2 Login

- Normalize email and look up account safely.
- Compare password asynchronously.
- Return a generic invalid-credentials response for absent user/wrong password to minimize account enumeration.
- Reject blocked/deleted accounts; require email verification before marketplace access.
- Issue a short-lived signed access JWT with minimal claims (`sub` user ID, role, token/session ID as needed, `iss`, `aud`, issued/expiry times). Do not place sensitive profile data inside token claims.
- Use fixed allowed algorithms; verify issuer/audience/expiry and expected token purpose.
- Issue a rotating refresh token whose hash/session record is stored server-side; refresh cookie is HttpOnly, Secure in production, and SameSite configured. Never store refresh token in localStorage.
- Return a safe public user DTO and access token to the React API layer; keep access token in memory, not localStorage/sessionStorage where practical.

### 7.3 Refresh, logout, CSRF, and revocation

- Refresh endpoint must validate the refresh cookie, session record/hash, expiry, and account status, then rotate the refresh session; invalidate the old credential to reduce replay risk.
- Store a hash of refresh tokens, not the clear token, when possible.
- Logout revokes the current refresh session and clears cookies.
- Since refresh/logout use cookies, enforce same-site policy and validate `Origin`/`Referer` against the configured client origin. Add an explicit CSRF mitigation for cookie-authenticated state-changing endpoints (for example, a double-submit token with a server-validated `X-CSRF-Token` header). Document and test this behaviour; SameSite alone is not the entire CSRF plan.
- On password reset or account block, revoke all affected refresh sessions. Access tokens should be short-lived; critical routes should check current account status from the database or a suitable revocation mechanism.

### 7.4 Authentication middleware

- Parse Bearer access token from the Authorization header (or follow one consistent documented design).
- Verify token signature, algorithm, expiry, issuer, audience, session/subject shape.
- Load the user by ID and reject missing, blocked, deleted, or otherwise invalid accounts.
- Attach a minimal trusted actor object to `req.user`.
- Apply `requireVerifiedStudent` to marketplace actions and `requireRole('admin')` to admin endpoints.
- Do not accept an actor/user ID from a request body to choose the authenticated principal.

## 8. Authorization and User Isolation

This section is a release blocker. Implement every item and add tests.

### 8.1 Standard ownership rules

- Profile: users can update their own profile; admins may inspect only the fields needed for administration.
- Listing: only `sellerId` can edit/remove it, and only in allowed states; admins can moderate separately.
- Wishlist: always query by both authenticated `userId` and the requested wishlist/listing association.
- Conversation: only `buyerId` or `sellerId` can access the conversation and its messages.
- Message: sender must be a conversation participant; client cannot forge `senderId`.
- Transaction: only buyer, seller, or appropriately authorized admin can read it; only the correct party can accept/decline/confirm according to state.
- Exchange offered listing: requester must be its owner and it must be active/unlocked.
- Resource: only approved resources are available to regular verified users; uploader can see their own moderation status; admin can moderate.
- Review: only the author may create it, only the other participant may be its target, and only after the linked transaction is completed.
- Report: only admin can resolve/assign/dismiss; reporter ID is derived from the current actor.
- Notification: every notification query/update must include the current user's ID.

### 8.2 Safe query patterns

Prefer scoped lookups such as “find conversation where code matches AND authenticated actor is buyer or seller” rather than loading by code and trusting the UI. For mutations, revalidate ownership and expected state at the same service/database operation where feasible.

- Do not accept arbitrary `$set`, `$inc`, `$where`, `populate` path, or MongoDB operators from the client.
- Build update objects from explicit field allowlists.
- Use safe DTO serializers instead of returning Mongoose documents wholesale.
- For sensitive objects, return `404` rather than revealing that another user's private record exists, according to consistent policy.
- If an admin may bypass an ownership rule, make the bypass explicit in admin-only service code and audit it.

## 9. Listing and Transaction State Logic

### 9.1 Centralize state transitions

Implement the legal state transition rules in services/constants, not independently in React components and controllers. A transition method should validate current state, actor permission, transaction ownership, and all related record constraints.

### 9.2 Listing transition rules

- Seller submits draft/rejected listing -> `pending`.
- Admin approves pending listing -> `active`.
- Admin rejects pending listing -> `rejected` plus a non-empty reason.
- Active sale listing -> `reserved` only if one transaction successfully reserves it.
- Reserved listing -> `active` only when the transaction that owns the reservation is validly cancelled/expired and the listing still references that transaction.
- Reserved listing -> `sold` only when the linked transaction is completed.
- Active listing -> `removed` by owner/admin only as policy permits.
- Sold/removed are terminal for regular users. Do not let a generic PATCH route reactivate them.

### 9.3 Prevent double reservation

Implement the sale reserve flow with a MongoDB transaction on a replica set:

1. Read current listing and assert active, sell type, not owned by requester, active verified user.
2. Create a transaction identifier and document in the same DB transaction.
3. Conditionally update listing using a filter that includes `_id`, `status: 'active'`, and other required state conditions; set `status: 'reserved'` and its `reservedTransactionId`.
4. If the conditional update matches zero documents, abort and return `409 ITEM_UNAVAILABLE`.
5. Commit and then create/dispatch notifications after the durable commit. Use an outbox approach if notification delivery must be guaranteed.

Never rely on a prior read alone to ensure exclusivity. Add an integration test that runs competing reservation attempts and verifies only one succeeds.

### 9.4 Exchange accept/cancel/complete

- A pending exchange request must reference the expected listing, seller, requester, and optional offered listing.
- On accept, start a database transaction and conditionally lock requested and offered listings. If either is no longer active/owned by the expected users, abort cleanly.
- Decline does not reserve an item.
- Cancel/expiry releases only locks owned by the transaction, not locks created by another transaction.
- On completion, update the transaction and all involved listings consistently; retain `txnType: 'exchange'` as the historical truth.
- Prevent a requester from offering an inactive, reserved, removed, sold, or third-party listing.

### 9.5 Reservation expiry job

- Define a configurable reservation duration; do not hard-code it in multiple files.
- Job selects eligible expired transactions in bounded batches.
- Conditional updates ensure only the transaction owning a reservation can release that listing.
- Job is idempotent and safe to rerun after a crash.
- Do not start multiple duplicate schedulers in horizontally scaled production instances. Use a single worker, distributed lock, or scheduled job service if scaling.

## 10. Listing Search and Resource Discovery

- Create a query-builder function that only maps allowlisted query fields to MongoDB filters.
- Search defaults to `status: active` and excludes removed/rejected/pending/sold items.
- Define text search strategy once: MongoDB text index, managed search, or a deliberately designed indexed prefix strategy. Do not use unsanitized regex on user-supplied arbitrary input over all documents.
- Apply numeric bounds to price filters and validate `minPrice <= maxPrice`.
- Normalize branch, year, semester, condition, subject, category, and listing type fields consistently.
- Use allowlisted sort values such as `newest`, `price_asc`, `price_desc`; never accept a raw field/expression from the client.
- Include stable tie-breaking in sort order to avoid repeated/missing results between pages.
- Index query patterns confirmed by tests/performance traces.
- Search results include minimal card data; fetch full details separately.

## 11. File Upload and Media Integration

### 11.1 Upload pipeline

1. Authenticate, verify account state, and authorize upload action before accepting the full file where possible.
2. Use Multer with explicit field names, maximum file count, file-size limit, and memory/disk strategy chosen based on deployment limits. Never use unrestricted uploads or the default unlimited settings.
3. Validate allowed extension, MIME allowlist, file signature using a content-detection library, dimensions when relevant, and resource format policy.
4. Reject unsupported, malformed, empty, or oversized files with stable validation errors.
5. Generate a safe server-side file name and folder path; never trust a path from the client.
6. Upload through the ImageKit server SDK. Keep its private key server-only.
7. Persist provider file ID and metadata. For resource uploads, create status `pending`; only approved resources are downloadable.
8. If database persistence fails after the remote upload succeeds, try to delete the orphaned remote file and log a redacted recovery event.
9. For replacement/deletion, authorize the owner/admin first and handle provider deletion failures safely.
10. Return only the metadata needed by the client, never provider credentials or secret access data.

### 11.2 ImageKit-specific safety

- Use `@imagekit/nodejs` on the server, not the private SDK key in the browser.
- Follow the installed SDK's current upload/signing methods; check the official SDK reference with available documentation tools if its API has changed. Add a small adapter in `services/media.service.js` so controllers do not depend on vendor-specific calls.
- Store ImageKit file IDs for delete/replace operations.
- Listing photos may use normal CDN URLs only if that visibility is acceptable to product policy.
- Study resources should use private storage/short-lived authorized links or a backend download proxy. Check authorization on every download request. Do not treat an unguessable URL as access control.
- Keep maximum byte sizes and allowed MIME types in a central configuration/constants module.

## 12. Chat and Notifications

### 12.1 REST-first chat

- Persist messages in MongoDB; REST history/send endpoints are the source of truth.
- Validate body is a non-empty bounded string. Prefer plaintext; do not support arbitrary HTML.
- Derive `senderId` from authenticated middleware.
- Before read/send, authorize the caller against the conversation's buyer/seller IDs and check account status.
- Use cursor or page-based history with a bounded result count and stable chronology.
- Update conversation's last-message metadata after successful message persistence.
- Generate a notification for the other participant. Deduplicate/retry strategy should be documented if notifications can fail.

### 12.2 Socket.IO, if used

- Authenticate socket handshake using the same short-lived access token and user/account check.
- Do not trust client-provided `userId` or room names.
- Server chooses room names and joins only after verifying the actor is a conversation participant.
- On every `send-message` event, re-check authorization, validate payload, persist the message first, create notification, then emit the saved message.
- Do not use a socket room as the only access-control check; private endpoints and events need explicit authorization.
- Handle reconnect, duplicate events, connection errors, and disconnected users. Persisted notifications/history must still work without a live socket.

### 12.3 Notification implementation

Centralize notification creation in a service callable from auth/listing/transaction/resource/report/admin modules. Notifications should store only safe text and a safe internal link/reference. Never allow a client to create notifications for arbitrary recipients.

## 13. Frontend Implementation Details

### 13.1 Routing map

Suggested route paths:

```text
/                         landing/login entry
/login                    login
/register                 student registration
/verify-email             email verification
/forgot-password          password recovery request
/reset-password           password reset
/app                      student dashboard
/marketplace              search/browse listings
/listings/new             create listing
/listings/:listingCode    listing details
/my-listings              current user's listings
/wishlist                 current user's wishlist
/messages                 current user's conversations
/messages/:conversationCode conversation detail
/transactions             current user's transactions
/resources                study library
/resources/upload         upload study resource
/profile                  own profile edit/view
/notifications            notifications
/admin                    admin dashboard
/admin/listings           listing moderation queue
/admin/resources          resource moderation queue
/admin/users              account management
/admin/reports            report queue
```

Use nested layouts to avoid duplicating navigation. Choose redirects and 403/404 pages consistently. Do not make every path accessible before authentication.

### 13.2 Route protection

- `PublicOnlyRoute` may redirect a logged-in user away from login/register for convenience.
- `RequireAuth` checks the client auth state and requests current user when needed.
- `RequireVerifiedStudent` prevents accidental navigation to protected student features for unverified accounts.
- `RequireAdmin` provides the admin UI guard.
- All server routes repeat these checks independently; client guards never grant permission.

### 13.3 API client and auth state

- Implement one `api-client.js` that sets the API base URL, attaches in-memory access tokens, converts JSON errors to a known shape, and handles refresh in one controlled place.
- Prevent multiple parallel 401 responses from triggering a stampede of refresh calls. Use a single refresh promise/queue and clear auth state on refresh failure.
- Avoid infinite retry loops on 401/403/429.
- Keep the current safe user object in a single auth provider/context; do not store full tokens/passwords in persistent browser storage.
- On logout, call the backend and clear frontend state/cache even when logout has a recoverable network error; explain any server-side uncertainty in the UI/logs without exposing credentials.
- Configure `credentials: 'include'` only for endpoints requiring the refresh/CSRF cookies and configure server CORS accordingly.

### 13.4 Server state and query invalidation

If TanStack Query is used:

- Define stable query keys in each feature.
- Invalidate listing/search/detail keys after create/edit/remove/moderation/reservation.
- Invalidate wishlist after add/remove.
- Invalidate conversation/history/unread notification keys after message send/read.
- Invalidate transaction/listing state keys after cancel/accept/complete.
- Do not treat stale cached status as authorization; the server's response always wins.

### 13.5 Forms and user feedback

- Share field components and validation/error display patterns.
- Validate immediately for usability but always rely on backend validation.
- Preserve user inputs after recoverable server errors.
- Show inline field errors from API validation where safe.
- Use accessible labels, help text, required indicators, keyboard-friendly dialogs, focus management, and actionable error messages.
- Confirm destructive actions and display the final state from the server.
- Every data-driven screen needs loading, empty, error, success, and retry/refresh handling where sensible.
- Do not hard-code admin statistics or pretend file/message uploads succeeded before the server confirms.

### 13.6 Required page details

- **Dashboard:** real counts/recent items/resources/notifications; safe quick links.
- **Marketplace:** debounced keyword search, URL-backed filters when practical, sorting, pagination, responsive listing cards, empty/error states.
- **Listing details:** photo gallery, condition, type, price, academic metadata, seller safe profile/rating, status, wishlist/chat/reserve/exchange/report actions gated by viewer and state.
- **Create/edit listing:** category, title, description, sell/exchange, price, condition, optional academic fields, photo selection, local preview, upload progress, validation and moderation status. For the source test TC06, missing price must fail.
- **My listings:** owner-only listing states and permitted edit/remove/resubmit controls.
- **Chat:** conversation list and contextual item display, ordered history, input length constraints, sending/failed states, unread state.
- **Transactions:** clear role-specific actions, item context, status history, expiry/cancellation info, handover confirmation.
- **Resources:** academic filters, approved resource cards, authorized download, upload status, copyright/report policy.
- **Profile:** current user's edit form and safe public preview.
- **Admin:** moderated paginated queue, rejection reason dialog, block/restore confirmation, report resolution notes, loading/empty/error states, database-backed stats.

### 13.7 UI quality and design-tool/skill use

When available in the coding agent environment:

- Inspect installed UI design/frontend skills and use relevant guidance before implementing the visual system.
- Use available browser automation or MCP browser tools for responsive review and real flows; if unavailable, run a local build and provide manual verification instructions instead of claiming browser QA.
- Use design/image-generation tools only when they improve original visual assets; do not use them for application logic, data models, or functional diagrams that must be editable.
- Prefer official library docs and repository-owned tools for package/API questions.
- Do not install or authorize new MCP servers/plugins without the user's required consent, and do not send private project/user data to unrelated third-party tools.

## 14. Backend Coding Standards

- Route definitions should be small and descriptive.
- Controllers should translate HTTP requests into service calls, then map results to status codes/responses. Keep complex business rules out of controllers.
- Services own authorization decisions that depend on domain state, state transitions, transactions, and side effects.
- Mongoose models own schema constraints, defaults, timestamps, and indexes; do not rely on Mongoose validation alone for authorization.
- Reuse a common `AppError` type and a central error handler.
- Express 5 supports rejected promises from async route handlers, but use one consistent error strategy and don't swallow errors.
- Use structured, redacted logs with request IDs.
- Avoid circular module dependencies; keep model imports and integrations organized.
- Never return `Model.find()` results directly; map to safe DTOs.
- Handle duplicate-key errors (`11000`) explicitly.
- Do not use synchronous password hashing or blocking file processing in request paths.
- Avoid unbounded loops/queries, unbounded upload memory, and huge populated documents.

## 15. Error Handling and Logging

### 15.1 Central errors

Create an `AppError` with status, stable code, public message, and optional safe validation details. The final error middleware should:

1. Recognize known validation, authentication, authorization, not-found, conflict, upload, and rate-limit errors.
2. Map known Mongoose validation/duplicate-key errors to safe responses.
3. Log unexpected errors with request ID and redacted context.
4. Return generic `500` in production.
5. Never leak stack traces, DB URI, token, OTP, provider credential, internal filesystem paths, or raw request secrets.

### 15.2 Logging policy

Log request ID, method, path, duration, status, and safe actor/code references. Redact authorization headers, cookies, passwords, OTPs, tokens, sensitive email/contact data, signed file URLs, and message bodies. Do not enable noisy production debug logging by default.

## 16. Testing Strategy and Test Matrix

### 16.1 Test layers

- **Unit tests:** validators, state transition rules, public-code generation, DTO sanitization, query allowlists, service business rules.
- **Integration tests:** Express routes + MongoDB + auth/authorization + persistence + expected status/error response.
- **Concurrency tests:** simultaneous reservations/exchange acceptance; only valid state transitions succeed.
- **Component tests:** React forms, validation messages, permissions-based controls, empty/error states.
- **End-to-end tests:** registration/verification, listing moderation, search, reservation/handover/review, resource upload moderation/download, admin denial.
- **Security regression tests:** cross-user object access, role spoofing, unsafe filters, expired tokens, rate limits, restricted file access.

### 16.2 Baseline cases

Implement and mark actual Pass/Fail for all TC01–TC18 from `project.md`. Do not mark tests passed without executing them. Include setup and any deliberate provider mocks in the test documentation.

### 16.3 Additional tests required before release

1. Register duplicate normalized email (case variations); one unique account only.
2. Send expired, already-used, malformed, and too-many-attempt OTPs.
3. Attempt admin self-registration/role spoofing.
4. Attempt cross-user profile/listing/wishlist/message/conversation/transaction/resource/notification access.
5. Attempt status spoofing (`active`, `sold`, `approved`) through user listing/resource updates.
6. Attempt upload with wrong MIME, wrong signature, unsupported extension, excessive file count, empty file, oversized file, and path-like filename.
7. Attempt resource download while unverified, blocked, or with a pending/rejected/removed resource.
8. Attempt duplicate review and review before completion.
9. Race two buyers to reserve the same listing.
10. Race two admins/requests to approve or transition one listing; enforce safe idempotency/conflict policy.
11. Attempt exchange with another user's offered listing and with an already-reserved offered item.
12. Cancel/expire stale transactions and verify they cannot release a listing now owned by another transaction.
13. Verify blocked user cannot refresh or use an established socket.
14. Verify every API list is bounded by pagination and filters reject injection/operator objects.
15. Verify secrets/private fields are absent from all serialized DTOs and logs.

### 16.4 Test data

- Seed only fictional local/demo accounts.
- Store no production credentials or real student's personal information in fixtures.
- Create admins using a controlled script; do not expose an open admin-registration endpoint.
- Use a test database that is isolated from development/production. Where multi-document transaction tests run, use a replica-set MongoDB test configuration.

## 17. Accessibility, Responsiveness, and Cross-Browser Checks

- Verify mobile widths, tablet layout, and desktop layout.
- Navigation and forms must work with keyboard alone.
- Use semantic headings, form labels, button names, alt text for meaningful images, and visible focus styles.
- Dialogs must manage focus and allow escape/close when appropriate.
- Status must include text/icons, not color only.
- Validate contrast and readable type sizes.
- Test current Chromium-based browser and at least one additional mainstream browser if the environment permits.
- Handle network errors and slow requests without freezing the whole interface.

## 18. README and Developer Experience

The root README must include:

- Product overview and scope.
- Architecture summary and repository tree.
- Supported Node.js/MongoDB requirements.
- Installation commands for workspaces/client/server.
- `.env` creation and description of every required key.
- How to start MongoDB (including replica-set setup when needed) and the application.
- How to seed categories and fictional demo data.
- How to create an admin securely.
- How to run lint, unit/integration tests, frontend build, and browser tests.
- API docs location.
- ImageKit/email-provider setup and local development alternatives.
- Known limitations, MVP exclusions, and future enhancements.
- Backup/restore approach and deployment notes.

Never put functioning secrets or production credentials in README.

## 19. Suggested Root Scripts

Use root scripts or workspaces so routine commands are discoverable. Align names with the final package manager setup:

```json
{
  "scripts": {
    "dev": "run client and server in development",
    "dev:client": "start Vite",
    "dev:server": "start Express in watch mode",
    "build": "build client and validate server syntax",
    "lint": "lint client and server",
    "format:check": "check formatting",
    "test": "run unit and integration tests",
    "test:e2e": "run Playwright tests when configured",
    "seed:categories": "seed controlled categories",
    "seed:demo": "seed fictional local demo data",
    "admin:create": "securely provision an admin account"
  }
}
```

The commands above are descriptive placeholders, not literal commands to leave unimplemented. Replace each with real npm scripts and verify it executes successfully. If using npm workspaces, `concurrently` may be used for parallel dev scripts.

## 20. Implementation Order and Exit Gates

### Gate 0 — Inspect and plan

- Inspect repo and existing files.
- Identify installed skills/MCP tools that materially improve design, documentation, coding, and tests.
- Confirm the current Node/npm versions and package compatibility.
- Set folder structure, environment validation, lint/format, and README.
- Exit when both client and server can start in a clean local setup and `/health/live` responds.

### Gate 1 — Authentication and data foundation

- MongoDB connection, Mongoose models, unique/index definitions, config, middleware, error handling, logging.
- Registration, email verification, login/logout/refresh, current user, profile, role/verification/account guards.
- Admin bootstrap script and safe DTO serializers.
- Exit only after auth and access-isolation tests pass.

### Gate 2 — Listings and search

- Categories, listing media upload, listing create/edit/remove/resubmit, admin approval/rejection, search/filters/pagination, wishlist.
- Exit only after TC05–TC09 and status-spoofing/ownership tests pass.

### Gate 3 — Communication and transactions

- Conversations/messages, persisted notifications, reserve race handling, exchange request accept/decline, cancellation/expiry, handover completion, reviews.
- Add Socket.IO only after REST persistence and authorization work.
- Exit only after TC10–TC14 and concurrency/cross-user tests pass.

### Gate 4 — Resource library and administration

- Resource upload/moderation/download controls, reports, account block/restore, dashboard analytics, audit events.
- Exit only after TC15–TC18 and restricted-download/admin-boundary tests pass.

### Gate 5 — Release hardening

- Responsive review, accessibility checks, error/empty/loading states, build/lint/test suite, backup/restore guidance, deployment CORS/cookies/HTTPS settings, security review.
- Update API docs and record actual test outcomes.
- Exit only when `project.md` definition of done is satisfied or clearly listed as partially complete with reasons.

## 21. Final Review Checklist

### Architecture and code

- [ ] Client is built with Vite + React.
- [ ] Server is Express.js and MongoDB/Mongoose is the persisted database.
- [ ] Feature modules have clear route/controller/service/validation responsibilities.
- [ ] App creation is separated from the server listener for reliable tests.
- [ ] Environment validation and structured redacted logging are configured.

### Identity and security

- [ ] College email domain is enforced on the server.
- [ ] Password hash is excluded from response DTOs.
- [ ] User/public codes are generated server-side, immutable, and unique.
- [ ] Registration cannot create an admin account.
- [ ] Auth, verification, refresh, and recovery routes are rate-limited.
- [ ] Refresh rotation/revocation and CSRF/origin strategy are implemented and tested.
- [ ] Every user-owned query checks the authenticated actor/participant relationship.
- [ ] Blocked/unverified users cannot perform protected actions.
- [ ] No secret or private contact detail is included in client bundles or logs.

### Domain correctness

- [ ] Listing/resource moderation is enforced on the API.
- [ ] Search returns only allowed statuses and uses bounded filters/pagination.
- [ ] Sale reservations are concurrency-safe.
- [ ] Exchange locks/cancellations cannot corrupt another transaction's state.
- [ ] Handover completion, listing state, reviews, and notifications are consistent.
- [ ] Chat history/messages are private to participants.
- [ ] Resource downloads are authorized per request.
- [ ] Reports, admin decisions, and sensitive state transitions are auditable.

### Delivery

- [ ] `.env.example` contains placeholders only and `.env` is ignored.
- [ ] README setup/seed/test commands were executed.
- [ ] Automated tests and build actually pass in the target environment.
- [ ] Baseline TC01–TC18 results are recorded honestly.
- [ ] No required button is fake or unimplemented without an explicit label.
- [ ] Known limitations and out-of-scope features are documented.
