FROM node:21 AS build
RUN corepack enable
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
COPY . .
COPY ../../pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
RUN pnpm prisma:generate
RUN pnpm build:api

FROM node:21-slim AS production
RUN corepack enable
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
COPY --from=build /app/pnpm-lock.yaml ./
COPY --from=build /app/packages/api/package.json ./
COPY --from=build /app/packages/api/prisma ./prisma
COPY --from=build /app/packages/api/dist ./dist
RUN pnpm install --prod
RUN pnpm prisma:generate
ENV NODE_ENV production
CMD ["pnpm", "start"]