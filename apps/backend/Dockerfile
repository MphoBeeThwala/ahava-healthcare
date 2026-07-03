# Build from apps/backend/ directory (Railway Root Directory = "apps/backend").
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare yarn@4.9.1 --activate
WORKDIR /app

# Install all dependencies (including devDependencies needed for build)
FROM base AS deps
COPY package.json ./
# yarn.lock is optional on first setup; commit it after running `yarn install` locally
RUN touch yarn.lock && yarn install

# Build: generate Prisma client, compile TypeScript
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn dlx prisma generate --schema=prisma/schema.prisma
RUN yarn run build

# Production image: copy only compiled output + runtime deps
FROM node:20-alpine AS runner
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 apiuser
WORKDIR /app
COPY --from=builder --chown=apiuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=apiuser:nodejs /app/dist ./dist
COPY --from=builder --chown=apiuser:nodejs /app/package.json ./
COPY --from=builder --chown=apiuser:nodejs /app/prisma ./prisma
USER apiuser
EXPOSE 4000
ENV NODE_ENV=production
CMD yarn dlx prisma migrate deploy && node dist/index.js
