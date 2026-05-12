**Overview**

This repository contains a monorepo with a Node/Express backend at `backend/` and a Vite + React frontend at `frontend/`.
Use Render to host the backend (Web Service / Docker) and the frontend (Static Site or Docker). Below are step-by-step instructions, required environment variables, and notes for admin routes and URLs.

**Quick summary**
- Backend: deploy as Render "Web Service" using `backend/Dockerfile` (fixed to build correctly)
- Frontend: deploy as Render "Static Site" (recommended) using `frontend` folder; set `VITE_API_URL` at build time to point to your backend
- Health check: `/api/v1/health`

**Prerequisites**
- Push this repo to GitHub and connect Render to that repo (or use Render's GitHub integration). For Git push help see `git push -u origin main`.
- Create or use a MongoDB (Atlas) and get `MONGODB_URI`.
- Add required secrets to Render (list below).

**1) Fixes already applied in this repo**
- `backend/Dockerfile` now installs devDependencies during the builder stage so `npm run build` succeeds, then prunes dev-deps before copying `node_modules` to the final image.

**2) Create Render service for backend (recommended: Docker Web Service)**
- In Render dashboard: New → Web Service → Connect repo → select branch (usually `main`).
- For "Environment" choose Docker (Render will detect Dockerfile). Set the Dockerfile path to `backend/Dockerfile`.
- Name: `marketplace-backend` (or your choice).
- Set the Health check path to `/api/v1/health`.
- Auto-deploy: enable (deploys on every push to branch).

Environment variables (Render → service → Environment): copy values from your production secrets. Required keys (minimum):
- `NODE_ENV` = `production`
- `MONGODB_URI` = your Atlas connection string
- `JWT_SECRET`, `JWT_REFRESH_SECRET` (32+ chars each)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, `EMAIL_FROM_NAME`
- `FRONTEND_URL` = `https://<your-frontend-site>` (set after frontend deploy)
- Optional: `REDIS_URL`, `REDIS_PASSWORD`, `OPENROUTER_API_KEY`, `SENTRY_DSN`, `STRIPE` keys

Notes:
- `PORT`: Render provides a runtime `PORT` env var automatically — the app reads `process.env.PORT` so no extra change is needed.
- If you use Atlas, ensure Atlas allows connections from Render; easiest for quick deploy: temporarily allow access from all IPs (0.0.0.0/0) then tighten later. Better: set Atlas network allowlist to Render IPs or use private networking where available.

**3) Create Render site for frontend (recommended: Static Site)**
Option A — Static Site (recommended):
- New → Static Site → Connect repo → choose branch.
- In "Root Directory" enter `frontend` (monorepo subdirectory).
- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`
- Environment variables (build time):
  - `VITE_API_URL` = `https://<your-backend-service>.onrender.com/api/v1`
- After deploy, your frontend will be live at Render's assigned URL. The admin UI pages live inside the same frontend app (likely under `/admin` or `/admin/*`) — no separate admin deploy unless you want one.

Option B — Docker (if you prefer the provided `frontend/Dockerfile`):
- Create a Web Service with Dockerfile path `frontend/Dockerfile`.
- That Dockerfile builds the site and serves with nginx. Set build env `VITE_API_URL` to your backend URL.

Important: Vite injects env vars at build time only — set `VITE_API_URL` in Render build/env configuration (Static Site build env or Docker build args) so the produced `dist` contains the correct API URL.

**4) DNS / Custom domain & CORS**
- In Render service settings add custom domains and follow Render's DNS instructions (CNAME / A records) — Render provisions TLS automatically.
- Set `FRONTEND_URL` in backend service env to your frontend domain (https://www.example.com) so CORS allows requests from the correct origin.
- Confirm `FRONTEND_URL` and `ADMIN_FRONTEND_URL` (if different) are set in the backend environment.

**5) CI & automatic deploys**
- Connect Render to GitHub on service creation — every push to the chosen branch triggers a build/deploy.
- For preview environments, enable PR previews in Render (optional).

**6) Health checks and scaling**
- Health path: `/api/v1/health` (set on backend service).
- Tune instance size/auto-scaling in Render if you expect traffic.

**7) Quick local checks before pushing**
Run locally:
```bash
# from repository root
# backend build + run locally
cd backend
npm ci
npm run build
npm start # or npm run dev for dev

# frontend build check
cd ../frontend
npm ci
npm run build
# serve `dist` locally to verify
npx serve dist
```

**8) Security checklist**
- Do NOT commit `backend/.env` or other secret files (already ignored by `.gitignore`).
- Use strong, unique `JWT_SECRET` values and a secure SMTP account.
- Prefer Atlas IP restrictions and rotate keys when needed.

**9) Admin area and URLs**
- The admin UI is part of the frontend app (check `frontend/src/pages/admin/*`). After the frontend deploy, the admin UI will be reachable at `https://<frontend-domain>/admin` (or the route defined by the app router).
- Backend admin routes are under `/api/v1/admin/*` — ensure the backend `ADMIN` role users exist (seed admin user via `backend/src/scripts/upsert-admin.ts` or use seeds).

**10) Troubleshooting**
- Docker builds fail: check `backend/Dockerfile` (fixed here) and Render build logs.
- CORS errors: verify `FRONTEND_URL` and `ADMIN_FRONTEND_URL` are correct in backend env.
- Mongo connection errors: confirm `MONGODB_URI` and Atlas network access list.

**Appendix — Minimal environment variables list you MUST set on Render for backend**
- `NODE_ENV`=production
- `MONGODB_URI`=mongodb+srv://... (Atlas)
- `JWT_SECRET` and `JWT_REFRESH_SECRET`
- `FRONTEND_URL`=https://your-frontend.onrender.com
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`

---
If you want, I can:
- Commit the `backend/Dockerfile` fix (already applied) and create a small `DEPLOY_TO_RENDER.md` (done).
- Attempt to create Render services automatically using the `gh` CLI (requires `gh` installed and auth), or I can walk you through creating them in the Render UI step-by-step.

Which next step do you want me to take? (A) Help create the Render services now, (B) walk you through creating them in the Render UI, or (C) finish pushing changes to GitHub from this machine once your SSH key + repo are ready.)
