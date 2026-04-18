# Messenger MVP - Quickstart Edition

A production-minded, highly scalable MVP for a Mobile Messenger built with React Native (Expo) and Node.js.

## Fast Local Testing (No Docker Required)

You asked for a fast way to test this without any hassle. I have configured the backend to use **SQLite** (a local file database) instead of PostgreSQL/Docker, and added Web support to the mobile app.

To test the entire system right now in your browser:

1. Open your terminal in the root of the project.
2. Run this single command:
   ```bash
   npm run quickstart
   ```

*This will automatically install dependencies, initialize the database, start the API on port 4000, and launch the Expo web app. Just press **`w`** in the terminal if it doesn't open the browser automatically.*

## Monorepo Architecture
- `/apps/mobile`: Expo React Native client (Supports iOS, Android, and Web)
- `/apps/api`: Node.js Express Backend with Socket.io and Prisma (SQLite)
