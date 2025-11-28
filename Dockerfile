# CipherLink Production Dockerfile
# Multi-stage build for optimal image size

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/client

# Copy frontend package files
COPY cipherLink/client/package*.json ./

# Install frontend dependencies
RUN npm ci --only=production=false

# Copy frontend source
COPY cipherLink/client/ ./

# Build frontend for production
RUN npm run build

# Stage 2: Production server
FROM node:20-alpine AS production

# Add labels for container identification
LABEL maintainer="CipherLink Team"
LABEL version="2.0.0"
LABEL description="CipherLink - End-to-End Encrypted Messaging"

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S cipherlink -u 1001 -G nodejs

WORKDIR /app

# Copy backend package files
COPY cipherLink/package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy backend source
COPY cipherLink/src/ ./src/

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/client/dist ./client/dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4200

# Set ownership to non-root user
RUN chown -R cipherlink:nodejs /app

# Switch to non-root user
USER cipherlink

# Expose port
EXPOSE 4200

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4200/api/health || exit 1

# Start server
CMD ["node", "src/index.js"]
