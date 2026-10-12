# CampusExchange — Backend REST API

A robust, production-ready Node.js & Express REST API powered by MongoDB (Mongoose) with authentication, role-based access control, Socket.IO real-time notifications, file uploads, and moderation workflows.

This backend is **fully independent** and can be run, tested, and deployed separately from the frontend.

---

## Architecture: Modular MVC

The backend uses a standard **Modular Model-View-Controller (MVC)** architecture. Every feature is encapsulated in a dedicated module, making it easy to read, maintain, and test:

```text
backend/
├── package.json               # Backend dependencies and standalone scripts
├── vitest.config.js           # Unit & integration test configuration
├── .env.example               # Environment variables template
└── src/
    ├── server.js              # Server bootstrapper & Socket.IO initialization
    ├── app.js                 # Express application & middleware pipeline
    ├── models/                # [Models] Mongoose schemas (User, Listing, Transaction, etc.)
    ├── modules/               # [Controllers & Services] Modular domain features:
    │   ├── auth/              # Auth routes, controller, service & validation
    │   ├── listings/          # Marketplace listings & inventory management
    │   ├── resources/         # PYQs and study resource document library
    │   ├── conversations/     # Chat and message history
    │   ├── transactions/      # Reservation, handover, and exchange ledger
    │   ├── wishlist/          # User wishlist
    │   ├── reviews/           # Post-completion ratings
    │   ├── notifications/     # In-app notification center
    │   ├── users/             # Profile management & public views
    │   ├── categories/        # Dynamic category hierarchy
    │   ├── reports/           # Content moderation abuse reports
    │   └── admin/             # Administrator dashboard & moderation queues
    ├── middleware/            # Auth guard, error handling, rate limiting, validation
    ├── config/                # Database connection, CORS, mailer, logger config
    ├── services/              # Shared services (JWT tokens, email, ImageKit uploads)
    ├── scripts/               # Seeding (demo data, categories) & admin provisioning
    └── tests/                 # Comprehensive unit & acceptance test suites
```

---

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update your MongoDB URI in `.env` if you have a local or cloud instance.
*(Note: If no database is available, the backend automatically uses an in-memory replica set for zero-friction local development and testing).*

### 3. Start Development Server
```bash
npm run dev
```
The server will start at [http://localhost:5000](http://localhost:5000).
Health check: [http://localhost:5000/health/live](http://localhost:5000/health/live)

### 4. Seed Demo Data (Optional)
```bash
npm run seed:demo
```
This provisions sample categories, demo student accounts, listings, and study resources.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Runs the server in development mode with auto-reload (`nodemon`). |
| `npm start` | Runs the server in production mode (`node src/server.js`). |
| `npm test` | Runs the Vitest integration and unit test suites. |
| `npm run lint` | Verifies syntax across all backend JavaScript files. |
| `npm run seed:categories` | Populates default campus categories. |
| `npm run seed:demo` | Seeds full demo data (users, listings, resources). |
| `npm run admin:create` | Creates a verified administrator account. |

---

## Standalone Deployment

Deploy to any Node.js hosting platform (e.g. Render, Railway, Fly.io, Heroku, AWS, DigitalOcean):

1. **Build Command**: `npm install`
2. **Start Command**: `npm start`
3. **Environment Variables**:
   - `NODE_ENV=production`
   - `PORT=5000` (or provided by host)
   - `MONGODB_URI=your_mongodb_atlas_connection_string`
   - `CLIENT_ORIGIN=https://your-frontend-app.vercel.app` (comma-separated list of allowed frontend domains)
   - `JWT_ACCESS_SECRET` & `JWT_REFRESH_SECRET` (generate secure random strings)
   - Configure SMTP and ImageKit keys for production emails and media uploads.
