# Operations, Seeding & Deployment Guide

## 1. Environment Configuration
Copy `.env.example` to `backend/.env` and `frontend/.env` (or configure environment variables in your deployment platform):

### Backend (`backend/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment (`development`, `test`, `production`) | `development` |
| `PORT` | Backend HTTP port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/campus_exchange` |
| `CORS_ORIGIN` | Allowed frontend origin(s), comma-separated | `http://localhost:5173` |
| `COLLEGE_EMAIL_DOMAINS` | Comma-separated allowed campus email domains | `university.ac.in,nit.ac.in,iit.ac.in,iiit.ac.in,college.edu` |
| `JWT_ACCESS_SECRET` | Secret for signing short-lived access tokens | *(min 16 chars)* |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | *(min 16 chars)* |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh session TTL | `7d` |
| `COOKIE_SECURE` | Set `true` in HTTPS production environments | `false` |
| `STORAGE_PROVIDER` | `local` (writes to `backend/uploads`) or `imagekit` | `local` |
| `IMAGEKIT_PUBLIC_KEY` | ImageKit public key (when `STORAGE_PROVIDER=imagekit`) | *(optional)* |
| `IMAGEKIT_PRIVATE_KEY` | ImageKit private key (when `STORAGE_PROVIDER=imagekit`) | *(optional)* |
| `IMAGEKIT_URL_ENDPOINT` | ImageKit URL endpoint | *(optional)* |

### Frontend (`frontend/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL for backend API calls | `/api/v1` (proxied to `http://localhost:5000` in Vite dev) |

---

## 2. Database Indexing & Seeding

### Create/Sync Indexes
```bash
npm run db:indexes --workspace=backend
```

### Seed Realistic Campus Data (`isDemoSeed: true`)
```bash
npm run seed
```
This populates categories, demo accounts, realistic textbook/equipment listings, PYQ/study resources, sample conversations, transactions, reviews, reports, and notifications. All seeded records are flagged with `isDemoSeed: true` and display a visible `DEMO` badge in the UI.

#### Demo Credentials (`npm run seed`)
- **Admin**: `admin@university.ac.in` / `CampusPass@123`
- **Verified Student (Aarav)**: `aarav.cse@university.ac.in` / `CampusPass@123`
- **Verified Student (Diya)**: `diya.ece@university.ac.in` / `CampusPass@123`
- **Verified Student (Rohan)**: `rohan.me@university.ac.in` / `CampusPass@123`
- **Unverified Student (Meera)**: `meera.ce@university.ac.in` / `CampusPass@123` (Verification code: `VERIFY-MEERA-2026`)

---

## 3. Health Checks & Structured Logging
- **Liveness**: `GET /api/v1/health/live` returns `200 OK` with process uptime.
- **Readiness**: `GET /api/v1/health/ready` checks active Mongoose connection state (`readyState === 1`).
- **Request Correlation**: Every request receives an `X-Request-Id` header and structured JSON log entry (`backend/src/config/logger.js`).
- **Audit Trail**: Every admin moderation or account enforcement action creates an immutable `AuditEvent` record inspectable via `GET /api/v1/admin/audit-logs`.
