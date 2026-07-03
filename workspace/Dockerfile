# Build from repo root: docker build -f workspace/Dockerfile .
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare yarn@4.9.1 --activate
WORKDIR /app

# Install dependencies (monorepo — needs root package.json)
FROM base AS deps
COPY package.json .yarnrc.yml ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/worker/package.json ./apps/worker/
COPY workspace/package.json ./workspace/
# yarn.lock is optional on first setup; commit it after running `yarn install` locally
RUN touch yarn.lock && yarn install

# Build Next.js standalone
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/workspace/node_modules ./workspace/node_modules
COPY . .
RUN mkdir -p /app/workspace/public && yarn workspace workspace build

# Production image — standalone server
# outputFileTracingRoot=repo-root causes Next.js to nest server.js at
# standalone/workspace/server.js (path relative to tracing root).
FROM node:20-alpine AS runner
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
WORKDIR /app
COPY --from=builder --chown=nextjs:nodejs /app/workspace/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/workspace/.next/static ./workspace/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/workspace/public ./workspace/public
USER nextjs
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "workspace/server.js"]
