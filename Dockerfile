# ---- Builder Stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@latest

# Copy only package files and install dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Copy the rest of the app and build
COPY . .
RUN pnpm build

# ---- Runner Stage ----
FROM node:20-alpine AS runner
WORKDIR /app

# Set HOME for the node user
ENV HOME=/home/node

RUN npm install -g pm2

ENV NODE_ENV=production

# Copy built app and dependencies from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js

# Change ownership to node user
RUN chown -R node:node /app

# Switch to non-root user
USER node

EXPOSE 3001

CMD ["pm2-runtime", "start", "node_modules/.bin/next", "--", "start"]
