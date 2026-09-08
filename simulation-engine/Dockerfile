# syntax=docker/dockerfile:1

FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY simulation-engine/package.json ./simulation-engine/package.json

RUN pnpm install --frozen-lockfile

COPY tsconfig.base.json ./
COPY simulation-engine/tsconfig.json ./simulation-engine/tsconfig.json
COPY simulation-engine/src ./simulation-engine/src

RUN pnpm --filter @sentinelai/simulation-engine build

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY simulation-engine/package.json ./simulation-engine/package.json

RUN pnpm install --prod --frozen-lockfile

COPY --from=build /app/simulation-engine/dist ./simulation-engine/dist

WORKDIR /app/simulation-engine

EXPOSE 4000

USER node

CMD ["node", "dist/index.js"]
