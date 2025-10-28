#!/bin/bash

# Production startup script for Railway
echo "🚀 Starting Socket.io Chat Server..."

# Set default environment variables if not provided
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-5000}

# Validate required environment variables
if [ -z "$MONGODB_URI" ]; then
    echo "❌ Error: MONGODB_URI environment variable is required"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ Error: JWT_SECRET environment variable is required"
    exit 1
fi

if [ -z "$CLIENT_URL" ]; then
    echo "❌ Error: CLIENT_URL environment variable is required"
    exit 1
fi

echo "✅ Environment variables validated"
echo "📱 Client URL: $CLIENT_URL"
echo "🌍 Environment: $NODE_ENV"
echo "🚪 Port: $PORT"

# Start the server
node server/server.js