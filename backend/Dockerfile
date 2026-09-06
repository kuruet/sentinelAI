# syntax=docker/dockerfile:1

FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/package.json

RUN pnpm install --frozen-lockfile

COPY tsconfig.base.json ./
COPY backend/tsconfig.json ./backend/tsconfig.json
COPY backend/tsconfig.build.json ./backend/tsconfig.build.json
COPY backend/prisma7.config.ts ./backend/prisma7.config.ts
COPY backend/prisma ./backend/prisma
COPY backend/src ./backend/src

RUN pnpm exec tsc -p backend/tsconfig.build.json

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/package.json

RUN pnpm install --prod --frozen-lockfile

COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/prisma ./backend/prisma
COPY --from=build /app/backend/prisma7.config.ts ./backend/prisma7.config.ts

WORKDIR /app/backend

EXPOSE 3000

USER node

CMD ["node", "dist/index.js"]
