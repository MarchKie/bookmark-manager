# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code and config files
COPY tsconfig*.json prisma.config.ts ./
COPY src ./src

# Generate Prisma client & build NestJS production bundle
RUN npx prisma generate
RUN npm run build

# Stage 2: Runner
FROM node:22-alpine AS runner

WORKDIR /app

# Copy package manifests & built dist
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3001

ENV PORT=3001
ENV NODE_ENV=production

CMD ["sh", "-c", "npx prisma db push && npx prisma db seed && node dist/src/main.js"]
