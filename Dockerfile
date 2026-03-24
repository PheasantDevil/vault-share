# Build stage
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/api-client/package.json packages/api-client/
COPY packages/crypto/package.json packages/crypto/
COPY packages/db/package.json packages/db/
RUN pnpm install --frozen-lockfile

COPY . .

# Next.js standaloneモードでは、NEXT_PUBLIC_*環境変数はビルド時に埋め込まれるため、
# ビルド時に環境変数を設定する必要がある
# ただし、ARGとして受け取ってENVに設定することで、ビルド時に使用可能にする
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID

ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID

RUN pnpm run build

# Production stage
FROM node:20-alpine AS runner

# Cloud Run でどのコミットのイメージか確認する（/api/config の buildSha）
ARG BUILD_SHA=
ENV BUILD_SHA=$BUILD_SHA

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Next.js standaloneモードでは、NEXT_PUBLIC_*はビルド時に埋め込まれるため、
# ランタイムの環境変数は使用されない。しかし、/api/configエンドポイントで
# サーバーサイドからprocess.envを読み込むため、環境変数を設定する必要がある
# （Cloud Runで設定された環境変数がprocess.envから読み込まれる）
# ただし、ビルド時に埋め込まれた値が優先されるため、ビルド時に設定する必要がある

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
