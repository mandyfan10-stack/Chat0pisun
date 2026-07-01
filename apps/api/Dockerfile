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

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy necessary files from builder
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

# Install production dependencies only
RUN npm ci --omit=dev --workspace=apps/api

WORKDIR /app/apps/api

# Create uploads directory and set correct ownership
RUN mkdir -p uploads && chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose API port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

# Start the application
CMD ["node", "dist/server.js"]
