# Cloud Build / Cloud Run — API + admin login page
FROM node:20-alpine AS web-builder
WORKDIR /web
COPY apps/admin-web/package*.json ./
RUN npm ci
COPY apps/admin-web/ ./
RUN npm run build

FROM node:20-alpine AS api-builder
WORKDIR /app
COPY apps/api/package*.json ./
RUN npm ci
COPY apps/api/ ./
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY apps/api/package*.json ./
RUN npm ci --omit=dev
COPY --from=api-builder /app/dist ./dist
COPY --from=web-builder /web/dist ./public
EXPOSE 8080
CMD ["node", "dist/main.js"]
