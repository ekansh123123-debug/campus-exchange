# CampusExchange — Verified College Student Marketplace & Academic Resource Library

CampusExchange is a web-based marketplace and study-resource library built exclusively for verified engineering students of a participating college. It unifies two core campus workflows inside a verified institutional boundary:

1. **Campus Marketplace & Handover Ledger**: Discover, buy, sell (`price: 0` for free items), or exchange (`exchange`) second-hand textbooks, scientific calculators, drawing instruments, and lab kits with concurrency-safe single-active reservations and seller-confirmed campus handovers.
2. **Moderated PYQ & Study-Resource Library**: Upload, search, filter, and download Previous-Year Question Papers (PYQs), lecture notes, lab manuals, syllabi, and reference materials organized by branch, academic year, semester, subject, and exam year.

---

## 1. Product Scope & MVP Boundaries

### In Scope (MVP)
- College-email domain allowlist registration (`COLLEGE_EMAIL_DOMAINS`) and 6-digit OTP verification (stored as SHA-256 hash with expiry, attempt limits, and resend cooldown).
- Short-lived JWT access tokens (`Authorization: Bearer`) + rotating `HttpOnly` refresh cookies (`ce_refresh`) backed by server-side `RefreshSession` records + double-submit CSRF validation (`ce_csrf` / `X-CSRF-Token`).
- Student profiles (`fullName`, `branch`, `academicYear`, `bio`, `contactPreferences`) with a Safe Public Profile Preview that never leaks email or credentials.
- Listing creation, editing, removal, image uploads (up to 6 images, 5 MB each), `sell`/`exchange` types, integer currency storage (`pricePaise`), and administrator moderation (`pending` → `active` / `rejected`).
- Marketplace discovery with debounced keyword search (`q`), category, branch, academic year, semester, subject, min/max price, condition, listing type, stable sorting (`newest`, `price_asc`, `price_desc`), and bounded pagination.
- Wishlist (`{ userId, listingId }` unique index), item-specific private chat (`Conversation` + `Message` + optional Socket.IO real-time delivery), concurrency-safe reservations, exchange proposals (`accept`/`decline`), cancellation/expiry job, handover confirmation, and 1–5 star post-completion reviews.
- PYQ/study-resource PDF uploads (up to 20 MB, binary `%PDF-` signature check), moderation (`pending` → `active` / `rejected` / `removed`), and authenticated downloads.
- Policy reporting (`listing`, `user`, `resource`), account blocking/restoration with immediate refresh-session revocation, admin telemetry dashboard, and immutable `AuditEvent` logs.

### Out of Scope for First Release (Future Enhancements)
- Online payment processing, escrow, or payment gateways (all transactions are physical on-campus handovers).
- Courier/shipping logistics.
- Native mobile iOS/Android apps and web push notifications.
- Multi-college tenant federation and automated AI content approval.

---

## 2. Architecture & Repository Structure

```text
campus-exchange/
├── project.md                    # Product & functional specification (FR-01–FR-15, TC01–TC18)
├── codeinstruction.md            # Implementation & security contract
├── DESIGN.md                     # Scholarly Warm-Canvas Design System tokens & rules
├── readme.md                     # Setup, environment, testing, and operations guide
├── package.json                  # Root workspaces & unified scripts
├── .env.example                  # Safe environment variable placeholders
├── docs/
│   ├── api.md                    # Complete /api/v1 REST endpoint contract
│   ├── data-model.md             # 14 Mongoose models, state transitions & indexes
│   ├── security.md               # Auth, RBAC, CSRF, user isolation & upload verification
│   ├── testing.md                # TC01–TC18 acceptance matrix & security test suite
│   └── operations.md             # Replica-set setup, seeding, backups & deployment
├── frontend/                     # Vite + React 19 + React Router 7 + TanStack Query v5
│   ├── index.html
│   ├── vite.config.js
│   ├── eslint.config.js
│   └── src/
│       ├── index.css             # Warm-parchment (#faf9f5) & terracotta (#cc785c) design system
│       ├── app/                  # App.jsx, router.jsx, providers.jsx, route-guards.jsx
│       ├── components/           # AppShell, StatusBadge, CodeBadge, FeedbackStates, ReportModal, ToastContext
│       ├── features/             # auth, dashboard, marketplace, listings, wishlist, conversations,
│       │                         # transactions, resources, profile, notifications, admin
│       ├── lib/                  # api-client.js, query-client.js, formatters.js, constants.js
│       └── test/                 # Frontend unit & component tests (app.test.jsx)
└── backend/                      # Node.js + Express 5 + Mongoose 9 + Socket.IO
    ├── package.json
    └── src/
        ├── app.js                # Express app factory (exportable without network listen)
        ├── server.js             # DB connection, Socket.IO attachment, scheduler & graceful shutdown
        ├── config/               # env.js, database.js, cors.js, logger.js, mail.js, imagekit.js
        ├── constants/            # roles, account-status, listing-status, transaction-status, resource-status, upload-limits
        ├── middleware/           # authenticate, require-role, require-verified-student, csrf, validate-request, rate-limits, upload, error-handler
        ├── models/               # 14 Mongoose models with explicit indexes
        ├── modules/              # auth, users, categories, listings, wishlist, conversations, transactions, reviews, resources, reports, notifications, admin
        ├── services/             # token, email, media, notification, audit, public-id
        ├── sockets/              # Authenticated Socket.IO handshake & room authorization
        ├── jobs/                 # expire-reservations.job.js
        ├── scripts/              # seed-categories.js, seed-demo-data.js, create-admin.js
        └── tests/                # unit/core.unit.test.js & integration/campus-exchange.integration.test.js
```

---

## 3. Prerequisites & Installation

- **Node.js**: v20+ (tested with ES modules and Express 5)
- **MongoDB**: MongoDB 6.0+ replica set (for multi-document ACID transactions).
  - *Zero-Config Local Fallback*: When `USE_IN_MEMORY_DB_IF_UNAVAILABLE=true` (enabled by default in development/test), if no local MongoDB daemon is listening on `127.0.0.1:27017`, the server automatically launches an embedded `MongoMemoryReplSet` replica set.

```bash
npm install
```

---

## 4. Environment Configuration (`.env`)

Copy `.env.example` to `backend/.env` (never commit real secrets):

```bash
cp .env.example backend/.env
```

| Variable | Description |
|---|---|
| `NODE_ENV` | `development`, `test`, or `production` |
| `PORT` | Backend HTTP port (default `5000`) |
| `CLIENT_ORIGIN` | Exact frontend origin for CORS & CSRF origin checks (`http://localhost:5173`) |
| `API_BASE_URL` | Base API URL (`http://localhost:5000/api/v1`) |
| `MONGODB_URI` | MongoDB connection string (`mongodb://127.0.0.1:27017/campus_exchange`) |
| `USE_IN_MEMORY_DB_IF_UNAVAILABLE` | `true` in local dev/test to boot `MongoMemoryReplSet` if local MongoDB is down |
| `COLLEGE_EMAIL_DOMAINS` | Comma-separated allowlist of institutional domains (e.g. `nitk.edu.in,campus.edu,example.edu`) |
| `JWT_ACCESS_SECRET` | Secret for signing short-lived access JWTs (min 32 chars in production) |
| `JWT_REFRESH_SECRET` | Distinct secret for signing refresh tokens |
| `JWT_ACCESS_TTL` | Access token TTL (`15m`) |
| `JWT_REFRESH_TTL_DAYS` | Refresh session lifetime in days (`14`) |
| `JWT_ISSUER` / `JWT_AUDIENCE` | Expected JWT issuer (`campus-exchange-api`) and audience (`campus-exchange-client`) |
| `COOKIE_SECURE` / `COOKIE_SAME_SITE` | `true` in HTTPS production; `strict` or `lax` |
| `EMAIL_FROM` / `SMTP_*` | SMTP settings for Nodemailer; leave `SMTP_HOST` empty in local dev to use the safe in-memory outbox preview (`/api/v1/auth/dev-mail-preview`) |
| `IMAGEKIT_*` | ImageKit server SDK keys and folder paths; leave empty in local dev/test to use the local controlled storage adapter |
| `MAX_LISTING_IMAGES` | Max photos per listing (`6`) |
| `MAX_IMAGE_SIZE_MB` | Max size per listing image (`5` MB) |
| `MAX_RESOURCE_SIZE_MB` | Max size per study resource PDF (`20` MB) |
| `RESERVATION_EXPIRY_HOURS` | Default hold duration before `expire-reservations.job.js` releases a lock (`48`) |
| `REFRESH_COOKIE_NAME` / `CSRF_COOKIE_NAME` | Cookie names (`ce_refresh` and `ce_csrf`) |

---

## 5. Running, Seeding & Admin Provisioning

```bash
# Start both backend (http://localhost:5000) and frontend (http://localhost:5173)
npm run dev

# Or start workspaces individually
npm run dev:server
npm run dev:client

# Seed controlled academic categories
npm run seed:categories

# Provision an administrator account securely (no public admin registration endpoint exists)
npm run admin:create

# Seed fictional local demo data (clearly marked with [DEMO] and DEMO SEED badges)
npm run seed:demo
```

> **Local Demo Accounts (when `seed:demo` or auto-seed runs in development)**:
> - **Admin**: `admin@nitk.edu.in` / `AdminCampus@2026`
> - **Verified Student 1**: `aarav.cs24@nitk.edu.in` / `Student@2026`
> - **Verified Student 2**: `priya.ec25@nitk.edu.in` / `Student@2026`

---

## 6. Testing, Linting & Build Verification

```bash
# Run all backend (unit + TC01–TC18 integration) and frontend component tests
npm test

# Run backend or frontend tests individually
npm run test:server
npm run test:client

# Run ESLint (frontend) and syntax/module checks (backend)
npm run lint

# Check formatting hygiene
npm run format:check

# Build production frontend bundle and verify backend entrypoints
npm run build
```

---

## 7. Backup, Restore & Deployment Notes

- **Database Backups**: Schedule daily `mongodump --uri="$MONGODB_URI" --archive=backup-$(date +%F).gz --gzip` snapshots and verify restores quarterly against a staging replica set using `mongorestore --gzip --archive=...`.
- **Media Backups**: Replicate ImageKit folders (`/campus-exchange/listings`, `/campus-exchange/resources`) and run orphan-reconciliation audits using stored `fileId` references.
- **Production Checklist**: Enforce HTTPS, set `NODE_ENV=production`, `COOKIE_SECURE=true`, provide strong 64-byte secrets for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`, configure production `COLLEGE_EMAIL_DOMAINS`, and run a single instance of `expire-reservations.job.js` (or guard with a distributed lock).

---

## 8. Documentation Index

- [`DESIGN.md`](./DESIGN.md) — Visual direction, color tokens, typography scale, and component rules
- [`docs/api.md`](./docs/api.md) — Complete `/api/v1` endpoint contract & response envelopes
- [`docs/data-model.md`](./docs/data-model.md) — 14 Mongoose collections, state machines, and indexes
- [`docs/security.md`](./docs/security.md) — Institutional verification, JWT rotation, CSRF, RBAC, and magic-byte validation
- [`docs/testing.md`](./docs/testing.md) — Acceptance matrix (TC01–TC18) and concurrency/security test coverage
- [`docs/operations.md`](./docs/operations.md) — Seeding, background jobs, logging, backup/restore, and deployment runbook
