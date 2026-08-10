FROM node:20-alpine as base
RUN apk add --no-cache g++ make python3 libc6-compat
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
EXPOSE 3000

FROM base as builder
WORKDIR /app
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM base as production
WORKDIR /app

ENV NODE_ENV=production
RUN pnpm install --frozen-lockfile --prod

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001
USER nestjs

COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

CMD ["node", "dist/src/main"]

FROM base as dev
ENV NODE_ENV=development
RUN pnpm install --frozen-lockfile
COPY . .
CMD ["pnpm", "run", "dev"]
