FROM node:20-alpine AS base
RUN corepack enable && corepack prepare yarn@4.9.1 --activate
WORKDIR /app

FROM base AS deps
COPY package.json .yarnrc.yml ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/worker/package.json ./apps/worker/
COPY workspace/package.json ./workspace/
COPY yarn.lock* ./
RUN yarn install

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/worker/node_modules ./apps/worker/node_modules
COPY . .
RUN yarn workspace @ahava-healthcare/worker build

FROM node:20-alpine AS runner
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 workeruser
WORKDIR /app/apps/worker
COPY --from=builder --chown=workeruser:nodejs /app/node_modules /app/node_modules
COPY --from=builder --chown=workeruser:nodejs /app/apps/worker/dist ./dist
COPY --from=builder --chown=workeruser:nodejs /app/apps/worker/node_modules ./node_modules
COPY --from=builder --chown=workeruser:nodejs /app/apps/worker/package.json ./
USER workeruser
ENV NODE_ENV=production
CMD node dist/worker.js
