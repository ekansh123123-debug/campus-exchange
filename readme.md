# CampusExchange

A full-stack, verified college student marketplace and academic resource library. Students can securely buy, sell, exchange textbooks and equipment, and upload or download Previous Year Questions (PYQs) and study notes.

The repository is structured as two **independent, decoupled applications** (`frontend` and `backend`) that can be developed, tested, and deployed separately.

---

## Project Structure

```text
CampusExchange/
├── backend/            # Independent Express.js REST API & MongoDB persistence layer
├── frontend/           # Independent React 19 + Vite single-page application
├── readme.md           # Getting started and architecture overview
├── .gitignore          # Repository ignore rules (keeps repo clean)
```

---

## 1. Backend API (`backend/`)

The backend is built with **Node.js, Express 5, and Mongoose 9**, using a **Modular Model-View-Controller (MVC)** architecture.

### Quick Start
1. Move into the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   The backend API will run on **http://localhost:5000** (health check: `http://localhost:5000/health/live`).

### Commands
- `npm run dev`: Start dev server with nodemon
- `npm start`: Start production server
- `npm test`: Run unit and integration tests (Vitest)
- `npm run lint`: Run syntax checks across backend files
- `npm run seed:demo`: Seed sample student accounts, listings, and resources

---

## 2. Frontend Client (`frontend/`)

The frontend is built with **React 19, Vite, React Router 7, and TanStack Query**.

### Quick Start
1. Move into the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open **http://localhost:5173** in your browser.

*(In local development, Vite automatically proxies `/api` and `/socket.io` calls to `http://localhost:5000`, so no backend URL configuration is required).*

### Commands
- `npm run dev`: Start Vite development server
- `npm run build`: Build production assets to `frontend/dist`
- `npm run preview`: Preview the production build locally
- `npm test`: Run frontend unit and component tests
- `npm run lint`: Run ESLint checks

---

## Independent Deployment

Both frontend and backend are completely decoupled:

- **Frontend Deployment (Vercel / Netlify / Cloudflare Pages / AWS S3)**:
  - Root directory: `frontend`
  - Build command: `npm run build`
  - Output directory: `dist`
  - Set `VITE_API_BASE_URL` to your production backend URL (e.g. `https://api.yourdomain.com/api/v1`).

- **Backend Deployment (Render / Railway / Fly.io / VPS)**:
  - Root directory: `backend`
  - Build command: `npm install`
  - Start command: `npm start`
  - Set environment variables from `backend/.env.example` (especially `MONGODB_URI`, `CLIENT_ORIGIN`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET`).
