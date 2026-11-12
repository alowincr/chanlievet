# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Build: instala dependencias, genera Prisma Client y compila API + seed.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY tsconfig.json prisma7.config.ts ./
COPY prisma ./prisma
COPY src ./src

RUN npx prisma generate
RUN npm run build

# ---------------------------------------------------------------------------
# Runtime: imagen liviana con el bundle, migraciones y Prisma CLI.
# Al iniciar aplica migraciones, ejecuta el seed idempotente y levanta la API.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

RUN apk add --no-cache openssl \
  && addgroup -S nodejs \
  && adduser -S nodejs -G nodejs

COPY --from=build --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nodejs:nodejs /app/prisma7.config.ts ./
COPY --from=build --chown=nodejs:nodejs /app/package.json ./

USER nodejs

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/seed.js && node dist/index.js"]
