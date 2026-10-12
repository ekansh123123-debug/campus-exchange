# CampusExchange Workspace Rules

## 1. NPM Workspaces & Vite 8 (Rolldown) Dependency Resolution
- Never create standalone `package-lock.json` files inside `frontend/` or `backend/`. Always manage dependencies from the repository root so shared peer dependencies (`react`, `react-dom`, `react-router`, `react-router-dom`) hoist consistently into root `node_modules/`.
- Keep `"name": "frontend"` in `frontend/package.json` and `"name": "backend"` in `backend/package.json` matching the workspace directory names in root `package.json`.
- Keep `resolve.dedupe: ['react', 'react-dom']` configured in `frontend/vite.config.js`.

## 2. Dev, Preview, and Build Scripts
- Run `npm run dev`, `npm run build`, `npm run preview`, and `npm test` from the repository root (`e:/new project/mini-project-1`).
- `scripts/dev.js` and `scripts/preview.js` must ensure the backend server on `:5000` is healthy (`GET /health/live`) before starting the Vite dev (`:5173`) or preview (`:4173`) servers.

## 3. Express 5 & Mongoose 9 Conventions
- **Express 5 Query Sanitization**: Express 5 parses bracketed query parameters as flat keys (e.g., `branch[$ne]`). Always check `key.startsWith('$') || key.includes('$') || key.includes('.')` when rejecting MongoDB operator injection.
- **Mongoose 9 Updates**: Always pass `{ returnDocument: 'after' }` instead of `{ new: true }` to `findOneAndUpdate` and `findOneAndReplace`.

## 4. Test Environment Isolation (`NODE_ENV=test`)
- When `env.isTest` is `true`, never connect to external `MONGODB_URI`, `SMTP_HOST`, or `IMAGEKIT_*` services from `backend/.env`. Always use `MongoMemoryReplSet`, the in-memory `devOutbox` mailer, and the local media storage fallback.

