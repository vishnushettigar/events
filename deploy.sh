#!/bin/bash

# Deployment script for Shettiga Events on AWS EC2
# Run this script as root or with sudo

set -e

echo "🚀 Starting deployment for shettigarevents.com..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="shettigarevents.com"
APP_DIR="/var/www/shettigarevents"
BACKEND_DIR="/home/ubuntu/events/sports_backend"
FRONTEND_DIR="/home/ubuntu/events/sports"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "Domain: $DOMAIN"
echo "App Directory: $APP_DIR"
echo "Backend Directory: $BACKEND_DIR"
echo "Frontend Directory: $FRONTEND_DIR"

# Create application directory
echo -e "\n${YELLOW}📁 Creating application directory...${NC}"
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Install dependencies
echo -e "\n${YELLOW}📦 Installing system dependencies...${NC}"
sudo apt update
sudo apt install -y nginx nodejs npm git curl

# Install PM2 for process management
echo -e "\n${YELLOW}🔧 Installing PM2...${NC}"
sudo npm install -g pm2

# Build and deploy frontend (Vite)
echo -e "\n${YELLOW}🏗️ Building React frontend with Vite...${NC}"
cd $FRONTEND_DIR
npm install
npm run build

echo -e "\n${YELLOW}📋 Deploying frontend...${NC}"
# Vite builds to 'dist' folder by default
sudo cp -r dist/* $APP_DIR/
sudo chown -R www-data:www-data $APP_DIR

# Setup backend
echo -e "\n${YELLOW}🔧 Setting up backend...${NC}"
cd $BACKEND_DIR
npm install

# Create PM2 ecosystem file
echo -e "\n${YELLOW}📝 Creating PM2 configuration...${NC}"
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'shettigarevents-backend',
    script: 'server.js',
    cwd: '$BACKEND_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/pm2/shettigarevents-error.log',
    out_file: '/var/log/pm2/shettigarevents-out.log',
    log_file: '/var/log/pm2/shettigarevents-combined.log'
  }]
};
EOF

# Create PM2 log directory
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

# Copy nginx configuration
echo -e "\n${YELLOW}🌐 Configuring nginx...${NC}"
sudo cp /home/ubuntu/events/nginx.conf /etc/nginx/sites-available/shettigarevents
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/shettigarevents /etc/nginx/sites-enabled/

# Test nginx configuration
echo -e "\n${YELLOW}🧪 Testing nginx configuration...${NC}"
sudo nginx -t

# Create firewall rules
echo -e "\n${YELLOW}🔥 Configuring firewall...${NC}"
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Start services
echo -e "\n${YELLOW}🚀 Starting services...${NC}"

# Start backend with PM2
cd $BACKEND_DIR
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Restart nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Create SSL certificate (optional)
echo -e "\n${YELLOW}🔒 SSL Certificate Setup${NC}"
echo "To enable HTTPS, run the following commands:"
echo "sudo apt install certbot python3-certbot-nginx"
echo "sudo certbot --nginx -d shettigarevents.com -d www.shettigarevents.com"

# Status check
echo -e "\n${GREEN}✅ Deployment completed!${NC}"
echo -e "\n${YELLOW}📊 Service Status:${NC}"
echo "Nginx status:"
sudo systemctl status nginx --no-pager -l

echo -e "\nPM2 status:"
pm2 status

echo -e "\n${GREEN}🌐 Your application is now live at:${NC}"
echo "http://shettigarevents.com"
echo -e "\n${YELLOW}📝 Next steps:${NC}"
echo "1. Set up SSL certificate for HTTPS"
echo "2. Configure your domain DNS to point to this EC2 instance"
echo "3. Monitor logs: pm2 logs shettigarevents-backend"
echo "4. Check nginx logs: sudo tail -f /var/log/nginx/shettigarevents.error.log"

echo -e "\n${GREEN}🎉 Deployment successful!${NC}" 