FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build Next.js
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy dependencies and built application from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
