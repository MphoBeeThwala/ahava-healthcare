# Multi-stage build for Ahava Healthcare Backend API
# Build context should be from repo root: docker build -f apps/backend/Dockerfile -t ahava-backend ../..
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy root package files for yarn workspace
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Copy workspace package files
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/prisma ./apps/backend/prisma

# Install dependencies
RUN yarn install --frozen-lockfile

# Generate Prisma Client
RUN yarn workspace @ahava-healthcare/api prisma:generate

# Build the application
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=deps /app/.yarn ./.yarn

# Copy source code
COPY package.json yarn.lock .yarnrc.yml ./
COPY apps/backend ./apps/backend
COPY tsconfig.json ./tsconfig.json

# Build TypeScript
RUN yarn workspace @ahava-healthcare/api build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 ahava

# Copy built application
COPY --from=builder --chown=ahava:nodejs /app/apps/backend/dist ./dist
COPY --from=builder --chown=ahava:nodejs /app/apps/backend/prisma ./prisma
COPY --from=builder --chown=ahava:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=ahava:nodejs /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder --chown=ahava:nodejs /app/apps/backend/package.json ./package.json

# Create uploads directory
RUN mkdir -p uploads/exports uploads/images uploads/documents uploads/files uploads/temp && \
    chown -R ahava:nodejs uploads

USER ahava

EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Default command runs API server
# Override with "node dist/workers/index.js" for worker process
CMD ["node", "dist/index.js"]

