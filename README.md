# Chat0pisun Messenger MVP

Local Messenger MVP with an Express/Socket.io API, Prisma SQLite persistence, a Vite web client, and an Expo mobile client.

## Prerequisites

- Node.js 22+
- npm
- Expo tooling through `npm run start --workspace=apps/mobile`

## Environment Setup

Copy the example env files before running locally:

```powershell
Copy-Item env.example .env
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
Copy-Item apps/mobile/.env.example apps/mobile/.env
```

For local MVP development this project uses SQLite:

```env
DATABASE_URL="file:./dev.db"
```

The local SQLite database files (`*.db`, `*.db-journal`) are intentionally ignored and must not be committed.

## Install And Database

```powershell
npm install
npm run db:generate
npm run db:setup
```

`apps/api/prisma/migrations/20260428193000_init_messaging/migration.sql` records the current database shape. `npm run db:setup` initializes the local SQLite database from that migration SQL. `npm run db:push` is also available if you prefer Prisma's schema-engine workflow.

## Run Locally

Start API and web together:

```powershell
npm run quickstart
```

Run workspaces separately:

```powershell
npm run dev:api
npm run dev:web
npm run dev:mobile
```

Default local URLs:

- API: `http://localhost:4000`
- Web: `http://localhost:5173`
- Expo mobile: `http://localhost:8081`

## Verification

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
```

The API test suite uses a separate ignored SQLite database (`apps/api/prisma/test.db`) and deletes it after the run.

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/users/search?q=...`
- `GET /api/chats`
- `POST /api/chats`
- `GET /api/chats/:chatId/messages`
- `POST /api/chats/:chatId/messages`

Socket.io requires `auth.token` and uses:

- client emits `chat:join`
- client emits `message:send`
- server emits `message:created`
- server emits `chat:updated`
- server emits `message:error`

## Android Emulator Networking

The mobile app defaults to `http://10.0.2.2:4000` on Android emulators and `http://localhost:4000` on iOS/web. For a physical device, set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` to your machine LAN address, for example:

```env
EXPO_PUBLIC_API_URL="http://192.168.1.25:4000"
```
