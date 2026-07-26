# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Accept Vite environment build arguments
ARG VITE_API_BASE_URL=http://localhost:3001
ARG VITE_AUTH0_DOMAIN=dev-yg.us.auth0.com
ARG VITE_AUTH0_CLIENT_ID=H9F6QG5SzTKMv0tbmgxLj9LjG1EKVllA
ARG VITE_AUTH0_AUDIENCE=https://bbl-candidate-test-api

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_AUTH0_DOMAIN=$VITE_AUTH0_DOMAIN
ENV VITE_AUTH0_CLIENT_ID=$VITE_AUTH0_CLIENT_ID
ENV VITE_AUTH0_AUDIENCE=$VITE_AUTH0_AUDIENCE

# Copy package manifests and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and config files
COPY tsconfig*.json vite.config.ts index.html ./
COPY src ./src
COPY public ./public

# Build Vite SPA bundle
RUN npm run build

# Stage 2: Runner
FROM nginx:alpine AS runner

# Copy custom Nginx SPA configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
