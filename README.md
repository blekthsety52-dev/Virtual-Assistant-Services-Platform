# Virtual Assistant Services Platform

This project now supports:

- local development with a Node + Express dev server
- Vercel deployment for the React frontend and `/api/*` serverless routes
- persistent production state through Upstash Redis on Vercel

## Local Development

**Prerequisites:** Node.js 20+

1. Install dependencies:
   `npm install`
2. Optionally create `.env.local` or `.env` and set:
   `GEMINI_API_KEY=your_key`
3. Start the local app:
   `npm run dev`

Local development keeps state in `src/data_store.json`.

## Build

- Production frontend build:
  `npm run build`
- Local production-style server:
  `npm run start`

## Deploy To Vercel

1. Push the repo to GitHub.
2. Import the repo into Vercel.
3. Use these project settings:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add environment variables in Vercel:
   - `GEMINI_API_KEY`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
5. Install the Upstash Redis integration from the Vercel Marketplace or create an Upstash Redis database manually.
6. Deploy.

## Custom Domain

After the first successful deployment:

1. Open your Vercel project.
2. Go to `Settings -> Domains`.
3. Add your domain, for example `app.yourdomain.com`.
4. Create the DNS record Vercel shows at your registrar.
5. Wait for verification and SSL issuance.

## Notes

- In Vercel, the API now runs from `api/[...route].ts`.
- If Redis is not configured in Vercel, the app falls back to in-memory state for that serverless instance only, which is not persistent.
- Client-side tabs do not require extra SPA rewrites because the app does not use browser-path routing.
