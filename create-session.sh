#!/bin/bash

# Script to help troubleshoot and create sessions

echo "🔍 Checking Docker services..."
docker-compose ps

echo ""
echo "🔗 Testing frontend connection..."
curl -f http://localhost:3000/health 2>/dev/null && echo "✅ Frontend is responding" || echo "❌ Frontend not responding"

echo ""
echo "🔗 Testing backend connection..."
curl -f http://localhost:3333 2>/dev/null && echo "✅ Backend is responding" || echo "❌ Backend not responding"

echo ""
echo "🔑 Checking environment variables in web container..."
docker-compose exec web env | grep -E "(SUPABASE|SANITY)" | head -5

echo ""
echo "📝 Example session creation:"
echo "curl -X POST http://localhost:3000/api/session/create \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"code\":\"TEST123\",\"title\":\"Test Session\",\"templateSlug\":\"default\"}'"

echo ""
echo "🚀 To create a session via web interface:"
echo "  1. Go to http://localhost:3000/facilitator"
echo "  2. Fill in session details"
echo "  3. Click 'Create Session'"

echo ""
echo "🐛 To view container logs:"
echo "  docker-compose logs web"
echo "  docker-compose logs studio"