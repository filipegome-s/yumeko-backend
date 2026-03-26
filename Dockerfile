FROM node:24-alpine AS builder

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN npm ci --ignore-scripts

COPY . .

RUN npm run build

FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/server.js"]
