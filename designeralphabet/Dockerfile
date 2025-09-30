# Frontend Dockerfile (SvelteKit)
FROM node:18-alpine AS builder

# Public environment defaults (override with --build-arg as needed)
ARG VITE_SUPABASE_URL="https://egdqbsalufeppxbopsfu.supabase.co"
ARG VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZHFic2FsdWZlcHB4Ym9wc2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMjM3NTQsImV4cCI6MjA3MTg5OTc1NH0.ixNh9N7xpntNTQ-CLJkanjuFKQ4XkjuuWqSpfVerDnw"
ARG VITE_SANITY_PROJECT_ID="pctfp1xq"
ARG VITE_SANITY_DATASET="production"
ARG VITE_SANITY_API_VERSION="2024-09-01"

ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL} \
    VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY} \
    VITE_SANITY_PROJECT_ID=${VITE_SANITY_PROJECT_ID} \
    VITE_SANITY_DATASET=${VITE_SANITY_DATASET} \
    VITE_SANITY_API_VERSION=${VITE_SANITY_API_VERSION}

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

# Re-declare build arguments for the runtime stage so they can be overridden per build
ARG VITE_SUPABASE_URL="https://egdqbsalufeppxbopsfu.supabase.co"
ARG VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZHFic2FsdWZlcHB4Ym9wc2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMjM3NTQsImV4cCI6MjA3MTg5OTc1NH0.ixNh9N7xpntNTQ-CLJkanjuFKQ4XkjuuWqSpfVerDnw"
ARG VITE_SANITY_PROJECT_ID="pctfp1xq"
ARG VITE_SANITY_DATASET="production"
ARG VITE_SANITY_API_VERSION="2024-09-01"

# Ensure the server listens on all interfaces when running in Docker
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    VITE_SUPABASE_URL=${VITE_SUPABASE_URL} \
    VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY} \
    VITE_SANITY_PROJECT_ID=${VITE_SANITY_PROJECT_ID} \
    VITE_SANITY_DATASET=${VITE_SANITY_DATASET} \
    VITE_SANITY_API_VERSION=${VITE_SANITY_API_VERSION}

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the build artifacts from the builder stage
COPY --from=builder /app/build ./build

EXPOSE 3000

CMD ["node", "build"]
