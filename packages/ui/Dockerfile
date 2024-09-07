FROM node:21 AS build
RUN corepack enable
WORKDIR /app
COPY . .
COPY ../../pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
RUN pnpm prisma:generate
RUN pnpm build:ui


FROM nginx:alpine
COPY --from=build /app/packages/ui/dist /usr/share/nginx/html
COPY --from=build /app/packages/ui/nginx.conf /etc/nginx/nginx.conf
CMD ["nginx", "-g", "daemon off;"]