## Simple Auth App (Neon + Resend)

This project includes:

- Sign up
- Email verification via Resend
- Login with JWT cookie session
- Forgot/reset password via email
- Protected dashboard
- Prisma ORM with Neon Postgres

## 1) Configure Environment

Copy `.env.example` values into `.env` and set real credentials:

- `DATABASE_URL` -> your Neon connection string
- `RESEND_API_KEY` -> your Resend API key
- `RESEND_FROM_EMAIL` -> verified sender in Resend
- `JWT_SECRET` -> a long random secret
- `NEXT_PUBLIC_APP_URL` -> app base URL (local: `http://localhost:3000`)

## 2) Install and Generate Prisma Client

```bash
npm install
npx prisma generate
```

## 3) Create Database Tables

```bash
npx prisma migrate dev --name init_auth
```

## 4) Run the App

```bash
npm run dev
```

Open `http://localhost:3000`.

## Main Routes

- `/signup`
- `/login`
- `/forgot-password`
- `/reset-password?token=...`
- `/dashboard`
- `/api/auth/verify-email?token=...`

## Notes

- `dashboard` requires a valid auth cookie from login.
- Login is blocked until email is verified.
- Verification links expire after 24 hours.

For production, make sure secure env vars are set in your hosting platform.

## Production Deploy Checklist

1. Set env vars in hosting:
- `DATABASE_URL`
- `JWT_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

2. Apply schema to Neon production DB:

```bash
npm run db:push
```

3. Ensure Prisma client generation runs during install:
- `postinstall` already runs `prisma generate`.
