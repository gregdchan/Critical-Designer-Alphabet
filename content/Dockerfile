# Sanity Studio Dockerfile
FROM node:20-alpine AS builder

WORKDIR /studio

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build the static studio assets
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3333

# `serve` provides a lightweight HTTP server with history fallback support
RUN npm install --global serve@14

# Copy the built Sanity studio assets
COPY --from=builder /studio/dist ./dist

EXPOSE 3333

CMD ["serve", "-s", "dist", "-l", "3333"]
