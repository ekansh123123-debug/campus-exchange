# CampusExchange — Frontend Client

A clean, modern React 19 single-page application built with Vite, Tailwind-compatible vanilla styling, React Router 7, and TanStack Query v5.

This frontend is **fully independent** and can be run, built, and deployed separately from the backend.

---

## Features

- **Campus Marketplace UI**: Discover, list, search, filter, and reserve textbooks and campus essentials.
- **Resource Library UI**: Upload, browse, and download Previous Year Questions (PYQs), notes, and study material.
- **Real-Time Notifications & Messaging**: Integrated with Socket.IO client and polling fallback.
- **Authentication**: JWT token management, double-submit CSRF protection, and college email OTP verification flow.
- **Admin Dashboard**: Moderation queues for listings, resources, reports, and user management.

---

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional for Local Dev)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(By default in local development, Vite proxies all `/api` requests directly to `http://localhost:5000`, so no extra URL configuration is needed).*

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts Vite local development server at `http://localhost:5173` with Hot Module Replacement (HMR). |
| `npm run build` | Builds optimized production assets into the `dist/` directory. |
| `npm run preview` | Serves the production build locally at `http://localhost:4173` to test before deploying. |
| `npm test` | Runs the Vitest test suite. |
| `npm run lint` | Runs ESLint syntax and code quality checks. |

---

## Standalone Deployment

Because the frontend is completely decoupled from the backend, you can deploy it to any modern static hosting service:

- **Vercel / Netlify / Cloudflare Pages / AWS S3**:
  1. Set build command: `npm run build`
  2. Set output directory: `dist`
  3. Set environment variable: `VITE_API_BASE_URL=https://your-backend-api-url.com/api/v1`
  4. Ensure Single Page Application (SPA) rewrite rule redirects all requests (`/*`) to `index.html`.
