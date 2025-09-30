#!/bin/bash

# Critical Designer Alphabet - Production Environment Launcher
# This script builds and starts both Sanity CMS and SvelteKit services for production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️${NC} $1"
}

# Function to cleanup background processes on exit
cleanup() {
    print_status "Shutting down production services..."
    if [[ -n ${SVELTE_PID:-} ]]; then
        kill $SVELTE_PID 2>/dev/null || true
        print_status "Stopped SvelteKit production server (PID: $SVELTE_PID)"
    fi
    if [[ -n ${SANITY_PID:-} ]]; then
        kill $SANITY_PID 2>/dev/null || true
        print_status "Stopped Sanity production server (PID: $SANITY_PID)"
    fi
    exit 0
}

# Set up cleanup trap
trap cleanup SIGINT SIGTERM

print_status "🚀 Starting Critical Designer Alphabet Production Environment"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for Node.js and npm
if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command_exists npm; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "Node.js and npm are available"

# Get the script directory (repository root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Set environment variables from .env files
if [[ -f "designeralphabet/.env" ]]; then
    print_status "Loading SvelteKit environment variables..."
    export $(cat designeralphabet/.env | grep -v '^#' | xargs) 2>/dev/null || true
fi

if [[ -f "content/.env" ]]; then
    print_status "Loading Sanity environment variables..."
    export $(cat content/.env | grep -v '^#' | xargs) 2>/dev/null || true
fi

# Build and start Sanity CMS
print_status "🎨 Building Sanity CMS..."
cd "$SCRIPT_DIR/content"

if [[ ! -d "node_modules" ]]; then
    print_warning "Installing Sanity dependencies..."
    npm install
else
    print_status "Sanity dependencies already installed"
fi

npm run build

print_status "🎨 Starting Sanity CMS production server..."
npm start > /tmp/sanity-prod.log 2>&1 &
SANITY_PID=$!
print_success "Sanity CMS running (PID: $SANITY_PID)"

# Build and start SvelteKit
print_status "⚡ Building SvelteKit application..."
cd "$SCRIPT_DIR/designeralphabet"

if [[ ! -d "node_modules" ]]; then
    print_warning "Installing SvelteKit dependencies..."
    npm install
else
    print_status "SvelteKit dependencies already installed"
fi

# Build with environment variables
if [[ -n "${SUPABASE_SERVICE_ROLE:-}" ]]; then
    print_status "Building with Supabase service role key"
    SUPABASE_SERVICE_ROLE=$SUPABASE_SERVICE_ROLE npm run build
else
    print_warning "Building without Supabase service role key"
    npm run build
fi

print_status "⚡ Starting SvelteKit production server..."
npm start > /tmp/svelte-prod.log 2>&1 &
SVELTE_PID=$!
print_success "SvelteKit app running (PID: $SVELTE_PID)"

# Return to root directory
cd "$SCRIPT_DIR"

echo ""
print_success "🎉 All production services started successfully!"
echo ""
echo -e "${PURPLE}📱 Production Services:${NC}"
echo -e "  ${BLUE}Sanity CMS:${NC}       http://localhost:3333"
echo -e "  ${BLUE}SvelteKit App:${NC}    http://localhost:4173"
echo ""
echo -e "${PURPLE}📋 Production Commands:${NC}"
echo -e "  ${YELLOW}Ctrl+C${NC}           Stop all services"
echo -e "  ${YELLOW}tail -f /tmp/sanity-prod.log${NC}  View Sanity logs"
echo -e "  ${YELLOW}tail -f /tmp/svelte-prod.log${NC}  View SvelteKit logs"
echo ""

# Wait a moment for services to start
sleep 3

# Check if services are running
if ! kill -0 $SANITY_PID 2>/dev/null; then
    print_error "Sanity failed to start. Check logs: tail -f /tmp/sanity-prod.log"
    cleanup
fi

if ! kill -0 $SVELTE_PID 2>/dev/null; then
    print_error "SvelteKit failed to start. Check logs: tail -f /tmp/svelte-prod.log"
    cleanup
fi

print_success "✨ Production environment is ready!"
print_status "Press Ctrl+C to stop all services"

# Keep script running and wait for background processes
wait