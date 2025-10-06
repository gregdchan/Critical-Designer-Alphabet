#!/bin/bash

# Critical Designer Alphabet - Development Environment Launcher
# This script starts both SvelteKit and Sanity CMS in development mode

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
    print_status "Shutting down services..."
    if [[ -n ${SVELTE_PID:-} ]]; then
        kill $SVELTE_PID 2>/dev/null || true
        print_status "Stopped SvelteKit dev server (PID: $SVELTE_PID)"
    fi
    if [[ -n ${SANITY_PID:-} ]]; then
        kill $SANITY_PID 2>/dev/null || true
        print_status "Stopped Sanity dev server (PID: $SANITY_PID)"
    fi
    exit 0
}

# Set up cleanup trap
trap cleanup SIGINT SIGTERM

print_status "🚀 Starting Critical Designer Alphabet Development Environment"
echo ""

# Check if Node.js and npm are available
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "Node.js and npm are available"

# Get the script directory (repository root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if directories exist
if [[ ! -d "designeralphabet" ]]; then
    print_error "designeralphabet directory not found!"
    exit 1
fi

if [[ ! -d "content" ]]; then
    print_error "content directory not found!"
    exit 1
fi

# Start SvelteKit development server
print_status "Starting SvelteKit development server..."
cd "$SCRIPT_DIR/designeralphabet"

# Check if node_modules exists, install if needed
if [[ ! -d "node_modules" ]]; then
    print_warning "Installing SvelteKit dependencies..."
    npm install
fi

# Load environment variables if .env exists
if [[ -f ".env" ]]; then
    print_status "Loading SvelteKit environment variables"
    export $(cat .env | grep -v '^#' | xargs) 2>/dev/null || true
fi

# Start SvelteKit in background
npm run dev -- --host 0.0.0.0 --port 5173 > /tmp/svelte.log 2>&1 &
SVELTE_PID=$!
print_success "SvelteKit started (PID: $SVELTE_PID)"

# Start Sanity CMS development server
print_status "Starting Sanity CMS development server..."
cd "$SCRIPT_DIR/content"

# Check if node_modules exists, install if needed
if [[ ! -d "node_modules" ]]; then
    print_warning "Installing Sanity dependencies..."
    npm install
fi

# Load environment variables if .env exists
if [[ -f ".env" ]]; then
    print_status "Loading Sanity environment variables"
    export $(cat .env | grep -v '^#' | xargs) 2>/dev/null || true
fi

# Fix Sanity config directory permissions if needed
if [[ ! -w "$HOME/.config/sanity" ]] 2>/dev/null; then
    print_status "Fixing Sanity config directory permissions..."
    sudo rm -rf "$HOME/.config/sanity" 2>/dev/null || true
    mkdir -p "$HOME/.config/sanity"
    echo '{}' > "$HOME/.config/sanity/config.json"
fi

# Start Sanity in background with update check disabled
SANITY_CLI_NO_UPDATE_NOTIFIER=1 npm run dev -- --host 0.0.0.0 --port 3333 > /tmp/sanity.log 2>&1 &
SANITY_PID=$!
print_success "Sanity CMS started (PID: $SANITY_PID)"

# Return to root directory
cd "$SCRIPT_DIR"

echo ""
print_success "🎉 All services are starting up!"
echo ""
echo -e "${PURPLE}📱 Services:${NC}"
echo -e "  ${BLUE}SvelteKit App:${NC}    http://localhost:5173"
echo -e "  ${BLUE}Sanity CMS:${NC}       http://localhost:3333"
echo ""
echo -e "${PURPLE}📋 Commands:${NC}"
echo -e "  ${YELLOW}Ctrl+C${NC}           Stop all services"
echo -e "  ${YELLOW}tail -f /tmp/svelte.log${NC}  View SvelteKit logs"
echo -e "  ${YELLOW}tail -f /tmp/sanity.log${NC}  View Sanity logs"
echo ""

# Wait a moment for services to start
sleep 3

# Check if services are running
if ! kill -0 $SVELTE_PID 2>/dev/null; then
    print_error "SvelteKit failed to start. Check logs: tail -f /tmp/svelte.log"
    cleanup
fi

if ! kill -0 $SANITY_PID 2>/dev/null; then
    print_error "Sanity failed to start. Check logs: tail -f /tmp/sanity.log"
    cleanup
fi

print_success "✨ Development environment is ready!"
print_status "Press Ctrl+C to stop all services"

# Wait for all background processes to finish
wait