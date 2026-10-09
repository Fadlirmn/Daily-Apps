FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.34.3 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN if [ ! -f .figma/make/site.json ]; then mkdir -p .figma/make && cp make/site.json .figma/make/site.json; fi
RUN pnpm build

FROM node:22-alpine AS runner

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.34.3 --activate
RUN apk add --no-cache nginx

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

WORKDIR /app/api
COPY api/package.json api/pnpm-lock.yaml* ./
RUN pnpm install --prod --no-frozen-lockfile

WORKDIR /app/api
COPY api/server.js ./

WORKDIR /app
COPY make-sure-services.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/make-sure-services.sh

EXPOSE 80

CMD ["/usr/local/bin/make-sure-services.sh"]
