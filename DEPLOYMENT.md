# Deploying CampusVoice to Vercel

CampusVoice is a **single Next.js project** at the repository root. The UI and
the API (`/api/v1/*`, backed by MongoDB) live in the **same app and same
origin**, so you upload one folder to GitHub and Vercel runs everything — no
separate backend to host.

> The older `frontend/` and `backend/` folders are a previous split
> (NestJS + separate Next.js) and are **not** used by Vercel. They are excluded
> via `.vercelignore`. You can delete them if you want a truly minimal repo.

## 1. Push to GitHub

Commit the repository root (the folder containing `package.json`,
`next.config.js`, `src/`, `vercel.json`) and push it to a GitHub repo.
`.env.local` is gitignored — your secrets are never committed.

## 2. Import into Vercel

1. New Project → import the GitHub repo.
2. **Root Directory:** leave as the repo root (where `package.json` lives).
3. Framework auto-detects as **Next.js** (`vercel.json` pins it).
4. Build command `next build` and install `npm install` are preset.

## 3. Set Environment Variables (Project → Settings → Environment Variables)

Copy these from `.env.example` and fill real values:

| Variable | Value |
| --- | --- |
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `MONGODB_DB_NAME` | `campusvoice` |
| `JWT_ACCESS_SECRET` | A long random string (32+ chars) |
| `JWT_REFRESH_SECRET` | A different long random string |
| `VOTE_HASH_SECRET` | A long random string |
| `ADMIN_USERNAME` | `super_admin` (first-boot admin) |
| `ADMIN_EMAIL` | `admin@campusvoice.local` |
| `ADMIN_PASSWORD` | A strong password |
| `SEED_DEMO_DATA` | `false` for a clean start (or `true` for demo data) |

Notes:
- **Do not** set `NEXT_PUBLIC_API_URL` — it defaults to the relative `/api/v1`,
  keeping the API same-origin so the secure, HttpOnly auth cookies work with no
  CORS configuration.
- On Vercel everything is HTTPS, so cookies are issued as `Secure; SameSite=Lax`
  automatically. No extra cookie settings are needed.

## 4. Allow Vercel to reach MongoDB Atlas

In Atlas → Network Access, add `0.0.0.0/0` (allow from anywhere) so Vercel's
serverless functions can connect. (Atlas still requires valid credentials.)

## 5. Deploy

Click **Deploy**. On the first API request the app connects to MongoDB, syncs
indexes, and — if the database is empty — bootstraps the super admin (and demo
data when `SEED_DEMO_DATA=true`). Open the deployment URL and sign in with your
`ADMIN_USERNAME` / `ADMIN_PASSWORD`.

## Local development

```
npm install
# create .env.local from .env.example and set MONGODB_URI
npm run dev        # http://localhost:3000  (UI + API together)
```

Over plain `http://localhost` cookies are non-secure in dev, so login works
normally. To test a production build locally over HTTP:
`COOKIE_SECURE=false npm run build && COOKIE_SECURE=false npm start`.

## Note on file uploads

Resolution-proof uploads are written to the server filesystem, which is
ephemeral on Vercel (files don't persist across invocations/deploys). For
durable uploads in production, wire the upload route to object storage
(e.g. Vercel Blob or S3). Everything else — auth, voting, elections, concerns,
messaging, admin — runs fully on Vercel as-is.
