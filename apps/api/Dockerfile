# Stage 1: Base & Dependencies
FROM node:22-alpine AS builder

WORKDIR /app

# Copy monorepo configuration
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

# Install dependencies (including dev for building)
RUN npm ci --workspace=apps/api

# Copy API source and prisma schema
COPY apps/api ./apps/api

# Generate Prisma client
WORKDIR /app/apps/api
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Stage 2: Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

# Install production dependencies only
RUN npm ci --omit=dev --workspace=apps/api

WORKDIR /app/apps/api

# Expose API port
EXPOSE 4000

# Start the application
CMD ["node", "dist/server.js"]
