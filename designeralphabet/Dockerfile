# Frontend Dockerfile (SvelteKit)
FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

# Ensure the server listens on all interfaces when running in Docker
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the build artifacts from the builder stage
COPY --from=builder /app/build ./build

EXPOSE 3000

CMD ["node", "build"]
