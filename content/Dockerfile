# Backend Dockerfile (Sanity CMS)
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

EXPOSE 3333

CMD ["npm", "start"]