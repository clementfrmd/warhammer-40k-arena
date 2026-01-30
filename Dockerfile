# Warhammer 40K Battle Arena - Game Server
# Docker image for Aleph Cloud deployment

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy server files
COPY server/ ./server/

# Copy static files for optional web UI serving
COPY index.html styles.css game.js battle.js characters.js factions.js security.js api.js ./public/

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start server
CMD ["node", "server/server.js"]
