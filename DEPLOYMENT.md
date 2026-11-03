# Deploying CampusVoice

CampusVoice is split into two deployables:

| Part | Tech | Where to host |
| --- | --- | --- |
| `frontend/` | Next.js 14 | **Vercel** (recommended) |
| `backend/` | NestJS + MongoDB | A **persistent Node host** (Render, Railway, Fly.io, a VM…) |

> The backend is **not** a good fit for Vercel serverless: it runs a `@Cron`
> election scheduler (needs a long-lived process), writes uploaded proof files
> to disk, and holds a MongoDB connection pool. Host it on a normal Node
> server. The frontend is the Vercel part.

---

## 1. Deploy the backend (Render / Railway / any Node host)

1. Create a service from this repo with **root directory `backend`**.
2. Build command: `npm install && npm run build`
3. Start command: `node dist/backend/src/main.js`
4. Set environment variables (see `backend/.env.example`). The important ones
   for a Vercel frontend:

   ```
   NODE_ENV=production
   PORT=3001                     # or whatever the host provides
   MONGODB_URI=...               # MongoDB Atlas connection string
   MONGODB_DB_NAME=campusvoice
   JWT_ACCESS_SECRET=...         # strong random, 32+ chars
   JWT_REFRESH_SECRET=...        # strong random, 32+ chars

   # Allow your Vercel domain(s) to call the API (comma-separated):
   CORS_ORIGIN=https://your-app.vercel.app
   # Optional: also allow *.vercel.app preview builds
   CORS_ALLOW_VERCEL_PREVIEWS=true

   # Cross-site cookies (frontend and backend on different domains).
   # Auto-enabled when NODE_ENV=production; this makes it explicit.
   COOKIE_CROSS_SITE=true
   ```

5. Make sure the host serves the backend over **HTTPS** — cross-site cookies
   require `Secure`, which only works on HTTPS.
6. On first boot, bootstrap the super admin (one-off) if your host supports a
   shell: `node dist/backend/src/scripts/bootstrap.js` (uses
   `ADMIN_USERNAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD`).

Note the backend's public URL, e.g. `https://campusvoice-api.onrender.com`.

## 2. Deploy the frontend to Vercel

1. Import the repo into Vercel and set **Root Directory = `frontend`**
   (Vercel auto-detects Next.js; `frontend/vercel.json` pins the settings).
2. Add an environment variable:

   ```
   NEXT_PUBLIC_API_URL=https://campusvoice-api.onrender.com/api/v1
   ```

   The value **must include the `/api/v1` suffix**.
3. Deploy. Vercel runs `next build` and serves the app.

## 3. Wire the two together

- Set the backend's `CORS_ORIGIN` to the exact Vercel URL Vercel gives you
  (e.g. `https://campus-voice.vercel.app`). Add a custom domain there too if
  you use one.
- Because auth uses secure, HttpOnly cookies, **both** sides must be HTTPS and
  the backend must have `COOKIE_CROSS_SITE=true` (or `NODE_ENV=production`).
- Redeploy the frontend after changing `NEXT_PUBLIC_API_URL` (it is inlined at
  build time).

## Local development (unchanged)

```
# backend
cd backend && npm install && npm run build && node dist/backend/src/main.js
# frontend
cd frontend && npm install && npm run dev
```

Locally, cookies stay `SameSite=Lax` (same-site, `http://localhost`) and CORS
allows `http://localhost:3000`, so no extra configuration is needed.
