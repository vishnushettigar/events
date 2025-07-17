#!/bin/bash

# Production Deployment Script for Shettiga Events
echo "🚀 Starting production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Remove old images (optional - uncomment if you want to force rebuild)
# print_status "Removing old images..."
# docker-compose -f docker-compose.prod.yml down --rmi all

# Build and start services
print_status "Building and starting production services..."
docker-compose -f docker-compose.prod.yml up --build -d

# Wait for services to start
print_status "Waiting for services to start..."
sleep 30

# Check if services are running
print_status "Checking service status..."
docker-compose -f docker-compose.prod.yml ps

# Test if services are healthy
print_status "Testing service health..."

# Test database
if docker exec shettigarevents-db-prod mysql -u root -proot -e "SELECT 1;" > /dev/null 2>&1; then
    print_status "✅ Database is healthy"
else
    print_error "❌ Database health check failed"
fi

# Test backend
if curl -f http://localhost:4000/health > /dev/null 2>&1; then
    print_status "✅ Backend is healthy"
else
    print_warning "⚠️ Backend health check failed or no health endpoint"
fi

# Test nginx
if curl -f http://localhost > /dev/null 2>&1; then
    print_status "✅ Nginx is healthy"
else
    print_error "❌ Nginx health check failed"
fi

print_status "🎉 Production deployment completed!"
print_status "Your application should be available at:"
print_status "  - HTTP: http://your-server-ip"
print_status "  - HTTPS: https://shettigarevents.com (after SSL setup)"

print_warning "Don't forget to:"
print_warning "  1. Set up SSL certificates with Let's Encrypt"
print_warning "  2. Configure your domain DNS to point to this server"
print_warning "  3. Set up firewall rules (ports 80, 443, 22)"
print_warning "  4. Configure database backups"

# Show logs if deployment failed
if [ $? -ne 0 ]; then
    print_error "Deployment failed. Showing logs..."
    docker-compose -f docker-compose.prod.yml logs --tail=50
fi