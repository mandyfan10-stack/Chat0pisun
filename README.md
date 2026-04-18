# Messenger MVP

A production-minded, highly scalable MVP for a Mobile Messenger built with React Native (Expo) and Node.js.

## Architecture
- **Frontend**: React Native (Expo), TypeScript, Zustand, React Navigation, React-i18next
- **Backend**: Express.js, TypeScript, Socket.io, Prisma, PostgreSQL, Redis, MinIO (S3)

## Prerequisites
- Node.js >= 18
- Docker & Docker Compose
- Expo Go app on your physical device (iOS App Store / Google Play Store)

## How to Run & Test the Mobile App Locally

### 1. Start Infrastructure Services (Database, Redis, MinIO)
Ensure Docker Desktop is running, then open your terminal and execute:
```bash
docker-compose up -d
```

### 2. Start the Backend API
In the same terminal, start the Node.js API:
```bash
npm install
npm run dev:api
```
*The backend server will run on `http://localhost:4000`.*

### 3. Configure Local IP for Physical Devices
If you are testing on a physical iPhone or Android device, the app cannot use `localhost` to connect to your computer's backend.
1. Find your computer's local IP address (e.g., `192.168.1.55`).
2. Open `apps/mobile/src/config/env.ts` and replace the placeholder `DEV_IP` with your actual local IP address:
```typescript
const DEV_IP = '192.168.1.55'; // Replace with your IP
```

### 4. Start the Mobile App (Expo)
Open a **second terminal window** in the root of the project and execute:
```bash
npm run dev:mobile
```
*A QR code will appear in your terminal.*

### 5. Open the App
- **On iPhone:** Open the default Camera app, point it at the QR code, and tap the notification to open it in **Expo Go**.
- **On Android:** Open the **Expo Go** app and tap "Scan QR code".
- **On an Emulator:** If you have an iOS Simulator or Android Emulator installed on your computer, simply press `i` (for iOS) or `a` (for Android) in the Expo terminal.

## Monorepo Structure
- `/apps/mobile`: Expo React Native client
- `/apps/api`: Node.js Express Backend
- `/packages/shared`: Shared types, interfaces, schemas (Planned)

## Roadmap
- [x] Monorepo architecture
- [x] Secure Authentication Flow
- [x] 1-on-1 Chat UI
- [x] User Search
- [ ] Push notifications
- [ ] Read receipts (DB schema done, needs UI integration)
- [ ] Group chats (Schema supports it, needs UI)
- [ ] End-to-end encryption
