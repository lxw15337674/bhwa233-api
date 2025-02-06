# Base stage for common dependencies
FROM node:20-alpine AS base

# Install pnpm and system dependencies
RUN npm install -g pnpm
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    python3 \
    dbus \
    fontconfig \
    font-wqy-zenhei \
    libstdc++ \
    libgcc \
    libx11 \
    libxcomposite \
    libxdamage \
    libxext \
    libxfixes \
    libxi \
    libxrandr \
    libxrender \
    libxss \
    libxtst \
    mesa-gbm \
    pango \
    wget

# Build stage
FROM base AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Install Playwright
RUN pnpm exec playwright install chromium

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Production stage
FROM base AS production

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies and Playwright
RUN pnpm install --prod
RUN pnpm exec playwright install chromium

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Set Playwright browser path
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Expose application port
EXPOSE 3000

# Start application
CMD ["pnpm", "start:prod"]
