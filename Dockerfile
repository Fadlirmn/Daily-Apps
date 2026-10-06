# ---- Builder: install deps + build Vite ----
FROM node:22-alpine AS builder

WORKDIR /app

# Aktifkan pnpm sesuai mise.toml (pnpm 10.34.3)
RUN corepack enable && corepack prepare pnpm@10.34.3 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
# vite.config.ts mengimpor ./.figma/make/site.json yang hanya tersedia di
# environment Figma Make. Untuk build standalone (Docker/clone),
# sediakan fallback dari make/site.json bila file tersebut belum ada.
RUN if [ ! -f .figma/make/site.json ]; then mkdir -p .figma/make && cp make/site.json .figma/make/site.json; fi
RUN pnpm build

# ---- Runner: serve dist via nginx (SPA fallback) ----
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
