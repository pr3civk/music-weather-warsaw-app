FROM oven/bun:1.3-alpine

WORKDIR /app

COPY package.json bun.lock ./
COPY packages/backend/package.json packages/backend/package.json
COPY packages/frontend/package.json packages/frontend/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN bun install --frozen-lockfile

COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend

WORKDIR /app/packages/backend

EXPOSE 3001
CMD ["sh", "-c", "bun run db:push && bun run dev"]
