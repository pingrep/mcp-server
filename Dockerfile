# PingRep MCP Server - Production Dockerfile

FROM node:22-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

RUN npm prune --omit=dev

FROM node:22-slim AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

USER node

EXPOSE 3000

CMD ["node", "dist/http.js"]
