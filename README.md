# Secure Asset Tracker

A role-based device-custody tracking application, built with Next.js 16 (App Router), Prisma 7 (SQLite), and NextAuth v5.

## Features
- Credentials-based authentication with bcrypt-hashed passwords
- Role-based access control (ADMIN / USER), enforced server-side via `proxy.ts` middleware and per-route checks
- Admins can view all users and all assets; regular users see only assets they own
- Full asset CRUD: create, update status, delete â€” with ownership checks on every write
- Input validation: unique serial numbers, required fields

## Setup
\`\`\`bash
npm install
npx prisma migrate dev
npx tsx prisma/seed.ts
npm run dev
\`\`\`

## Seeded accounts
Seeded accounts use SEED_ADMIN_PASSWORD and SEED_USER_PASSWORD from your .env file.

## Design decisions
- **String IDs (`cuid()`)** instead of auto-increment integers, to prevent ID enumeration attacks.
- **`ownerId` is optional** on `Asset`, since an asset can exist unassigned in storage before being issued to anyone.
- **Passwords are bcrypt-hashed**, never stored or logged in plain text.
- **No public self-registration** â€” accounts are provisioned by an admin only, consistent with centralized identity governance in enterprise systems.