FROM node:25.8.0-alpine3.23 AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:25.8.0-alpine3.23 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY tsconfig.json tsconfig.json
COPY src src
RUN npm run build

FROM node:25.8.0-alpine3.23 AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]