# Critical Designer Alphabet - Scripts Documentation

This document explains all the scripts available in the project and how to use them.

## 🚀 Development Scripts

### `run-all.sh` - Development Environment
**Purpose**: Start both SvelteKit and Sanity CMS in development mode

**Usage**:
```bash
./run-all.sh
```

**Features**:
- ✅ Colored output with timestamps
- ✅ Automatic dependency installation
- ✅ Environment variable loading
- ✅ Process cleanup on Ctrl+C
- ✅ Service health checking
- ✅ Log file management

**Services**:
- SvelteKit Dev Server: `http://localhost:5173`
- Sanity CMS Dev Server: `http://localhost:3333`

**Log Files**:
- SvelteKit: `/tmp/svelte.log`
- Sanity: `/tmp/sanity.log`

## 🏭 Production Scripts

### `start-all.sh` - Production Environment
**Purpose**: Build and start both services in production mode

**Usage**:
```bash
./start-all.sh
```

**Features**:
- ✅ Production builds before starting
- ✅ Environment variable validation
- ✅ Service health monitoring
- ✅ Graceful shutdown handling
- ✅ Production-optimized ports

**Services**:
- SvelteKit Production: `http://localhost:4173`
- Sanity CMS Production: `http://localhost:3333`

**Log Files**:
- SvelteKit: `/tmp/svelte-prod.log`
- Sanity: `/tmp/sanity-prod.log`

## 🔧 Individual Service Scripts

### SvelteKit (designeralphabet/)
```bash
cd designeralphabet

# Development
npm run dev

# Production build
npm run build

# Production start
npm start
```

### Sanity CMS (content/)
```bash
cd content

# Development
npm run dev

# Production build
npm run build

# Production start
npm start
```

## 🐳 Docker Deployment

### Full Stack Deployment
```bash
# Build and run both services
docker-compose up --build

# Run in detached mode
docker-compose up -d --build
```

### Individual Services
```bash
# Frontend only
docker-compose up frontend --build

# Backend only
docker-compose up backend --build
```

**Access Points:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3333

### Creating Live Design Sessions

After Docker services are running:

1. **Web Interface** (Recommended):
   ```bash
   # Navigate to facilitator page
   open http://localhost:3000/facilitator
   ```

2. **API Direct** (For testing):
   ```bash
   curl -X POST http://localhost:3000/api/session/create \
     -H 'Content-Type: application/json' \
     -d '{"code":"TEST123","title":"Test Session","templateSlug":"default"}'
   ```

3. **Session Troubleshooting**:
   ```bash
   # Use the helper script
   ./create-session.sh

   # Check container logs
   docker-compose logs web
   ```

## 🛠️ Troubleshooting

### Common Issues

1. **Port conflicts**:
   ```bash
   # Kill processes on specific ports
   lsof -ti:5173 | xargs kill -9  # SvelteKit dev
   lsof -ti:3333 | xargs kill -9  # Sanity
   lsof -ti:4173 | xargs kill -9  # SvelteKit prod
   ```

2. **Environment variables not loading**:
   - Check `.env` files exist in both directories
   - Verify no syntax errors in `.env` files
   - Ensure no spaces around `=` in variable assignments

3. **Build failures**:
   ```bash
   # Clean and reinstall dependencies
   cd designeralphabet && rm -rf node_modules && npm install
   cd ../content && rm -rf node_modules && npm install
   ```

4. **View logs**:
   ```bash
   # Development logs
   tail -f /tmp/svelte.log
   tail -f /tmp/sanity.log

   # Production logs
   tail -f /tmp/svelte-prod.log
   tail -f /tmp/sanity-prod.log
   ```

## 📋 Script Features

### Error Handling
- ✅ Exit on any error (`set -e`)
- ✅ Process cleanup on interruption
- ✅ Service health checks
- ✅ Dependency validation

### User Experience
- ✅ Colored, timestamped output
- ✅ Clear service URLs
- ✅ Progress indicators
- ✅ Helpful error messages
- ✅ Log file locations

### Environment Management
- ✅ Automatic .env loading
- ✅ Environment variable validation
- ✅ Production/development separation
- ✅ Service isolation

## 🔄 Quick Commands

```bash
# Start development environment
./run-all.sh

# Start production environment
./start-all.sh

# View all running services
ps aux | grep -E "(vite|sanity)"

# Stop all services
pkill -f "vite\|sanity"
```