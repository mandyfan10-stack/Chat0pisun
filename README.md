# Chat0pisun Messenger MVP

Monorepo messenger: Express/Socket.io API, Prisma + PostgreSQL, Redis, a Vite web client, and an Expo mobile client.

## Prerequisites

- Node.js 22+
- npm
- Docker & Docker Compose (for local Postgres and Redis)
- Expo CLI (`npm run start --workspace=apps/mobile`)

## Environment Setup

Copy the example env files before running locally:

```bash
cp env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env
```

Generate a strong JWT secret:

```bash
openssl rand -base64 32
```

Set it in `apps/api/.env`:

```env
JWT_SECRET="<generated value>"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/messenger"
REDIS_URL="redis://localhost:6379"
```

## Start Infrastructure

```bash
docker compose up -d db redis
```

## Install And Database

```bash
npm install
npm run db:generate
npm run db:setup
```

`apps/api/prisma/migrations/20260509103347_init/migration.sql` records the current database shape.

## Run Locally

Start API and web together:

```bash
npm run quickstart
```

Run workspaces separately:

```bash
npm run dev:api
npm run dev:web
npm run dev:mobile
```

Default local URLs:

- API: `http://localhost:4000`
- Web: `http://localhost:5173`
- Expo mobile: `http://localhost:8081`

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/users/search?q=...`
- `GET /api/chats`
- `POST /api/chats`
- `POST /api/chats/group`
- `GET /api/chats/:chatId/messages`
- `POST /api/chats/:chatId/messages`
- `POST /api/chats/:chatId/read`

## Socket.io

Connect with `auth.token` (access token). Events:

| Direction | Event | Payload |
|-----------|-------|---------|
| client → server | `chat:join` | `{ chatId }` |
| client → server | `message:send` | `{ chatId, text, tempId? }` |
| client → server | `chat:read` | `{ chatId }` |
| server → client | `message:created` | `{ tempId?, message }` |
| server → client | `chat:updated` | chat object |
| server → client | `chat:read` | `{ chatId, userId, readAt }` |
| server → client | `message:error` | `{ tempId?, error }` |
| server → client | `presence:update` | `{ userId, status }` |

## Metrics

`GET /metrics` requires `Authorization: Bearer <METRICS_TOKEN>`. Set `METRICS_TOKEN` in the API environment. If unset, the endpoint returns 404.

## Android Emulator Networking

The mobile app defaults to `http://10.0.2.2:4000` on Android emulators and `http://localhost:4000` on iOS/web. For a physical device, set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env`:

```env
EXPO_PUBLIC_API_URL="http://192.168.1.25:4000"
```

## Docker (Production)

```bash
docker compose up -d
```

All services start with health checks. `JWT_SECRET` must be set explicitly — the compose file rejects a missing value.
