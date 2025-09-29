#!/bin/bash

# Start All Services Script for Critical Designer Alphabet
# This script builds and starts both Sanity CMS and SvelteKit services

echo "🚀 Starting Critical Designer Alphabet Services..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for Node.js and npm
if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are available"

# Set environment variables from .env files
if [ -f "designeralphabet/.env" ]; then
    echo "📝 Loading SvelteKit environment variables..."
    export $(cat designeralphabet/.env | grep -v '^#' | xargs)
fi

if [ -f "content/.env" ]; then
    echo "📝 Loading Sanity environment variables..."
    export $(cat content/.env | grep -v '^#' | xargs)
fi

# Build and start Sanity CMS
echo "🎨 Building Sanity CMS..."
cd content
npm install
npm run build

echo "🎨 Starting Sanity CMS in background..."
npm run start &
SANITY_PID=$!
echo "Sanity CMS running with PID: $SANITY_PID"

# Return to root directory
cd ..

# Build and start SvelteKit
echo "⚡ Building SvelteKit application..."
cd designeralphabet
npm install

# Build with environment variables
SUPABASE_SERVICE_ROLE=$SUPABASE_SERVICE_ROLE npm run build

echo "⚡ Starting SvelteKit application..."
npm run preview &
SVELTE_PID=$!
echo "SvelteKit app running with PID: $SVELTE_PID"

# Return to root directory
cd ..

echo "🎉 All services started successfully!"
echo "📱 Sanity CMS: http://localhost:3333"
echo "🌐 SvelteKit App: http://localhost:4173"
echo ""
echo "To stop services:"
echo "kill $SANITY_PID $SVELTE_PID"

# Keep script running
wait