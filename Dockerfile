# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies and Playwright
RUN pnpm install
RUN pnpm exec playwright install --with-deps chromium
RUN pnpm exec playwright install-deps chromium

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Production stage
FROM node:20-alpine

# Install system dependencies for Playwright
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    python3

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies and Playwright
RUN pnpm install --prod
RUN pnpm exec playwright install --with-deps chromium
RUN pnpm exec playwright install-deps chromium

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Set Playwright browser path
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Expose application port
EXPOSE 3000

# Start application
CMD ["pnpm", "start:prod"]
