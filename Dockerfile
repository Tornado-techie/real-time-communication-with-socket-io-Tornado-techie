# Use the official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy server package files
COPY server/package*.json ./server/

# Install server dependencies
RUN cd server && npm ci --only=production

# Copy server source code
COPY server/ ./server/

# Expose port
EXPOSE 5000

# Start the server
CMD ["node", "server/server.js"]