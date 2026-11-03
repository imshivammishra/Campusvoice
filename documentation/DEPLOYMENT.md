# CampusVoice Deployment Guide

## Overview

CampusVoice is designed for production deployment on Ubuntu VPS with:
- MongoDB Atlas (managed database)
- Redis (managed or self-hosted)
- Nginx reverse proxy
- HTTPS via Certbot (Let's Encrypt)
- PM2 or Docker for process management

## Subdomains

- `campusvoice.example.com` — Frontend
- `api.campusvoice.example.com` — Backend API

## Prerequisites

- Ubuntu 22.04+ VPS
- MongoDB Atlas cluster
- Domain name with DNS configured
- SMTP email service (for notifications and password reset)
- Root or sudo access

## Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Install Redis (optional, if self-hosting)
sudo apt install -y redis-server
```

## Step 2: Clone Repository

```bash
git clone <your-repo-url> /opt/campusvoice
cd /opt/campusvoice
```

## Step 3: Environment Configuration

Copy the example environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Edit `backend/.env` with your values:

```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/campusvoice?retryWrites=true&w=majority
JWT_ACCESS_SECRET=<generate-32-char-secret>
JWT_REFRESH_SECRET=<generate-32-char-secret>
SMTP_HOST=smtp.yourprovider.com
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
ADMIN_PASSWORD=<secure-admin-password>
```

**Never commit `.env` files.**

## Step 4: MongoDB Atlas Setup

1. Create a cluster at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a database user with read/write permissions
3. Add your VPS IP to the Atlas IP access list
4. Get the connection string and add it to `MONGODB_URI`

## Step 5: Install Dependencies & Build

```bash
# Backend
cd backend
npm install --legacy-peer-deps
npm run build

# Frontend
cd ../frontend
npm install --legacy-peer-deps
npm run build
```

## Step 6: Bootstrap Super Admin

The first SUPER_ADMIN account must be created through a secure bootstrap procedure:

```bash
cd backend
ADMIN_USERNAME=super_admin \
ADMIN_EMAIL=admin@yourcollege.edu \
ADMIN_PASSWORD=<secure-password> \
npm run migration:run
```

**Never create a publicly accessible first-admin registration endpoint.**

Change the default password after first login.

## Step 7: PM2 Setup

```bash
cd /opt/campusvoice/backend
npm install -g pm2

pm2 start dist/main.js --name "campusvoice-backend"
pm2 save
pm2 startup
```

## Step 8: Nginx Configuration

Copy the Nginx config:

```bash
sudo cp infrastructure/nginx/nginx.conf /etc/nginx/sites-available/campusvoice
sudo ln -s /etc/nginx/sites-available/campusvoice /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
```

Update `server_name` to your actual domain, then:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

## Step 9: HTTPS with Certbot

```bash
sudo certbot --nginx -d campusvoice.example.com -d api.campusvoice.example.com
```

## Step 10: Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Step 11: Redis for BullMQ

If using Redis for background jobs:

```bash
# Start Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

Set `REDIS_URI=redis://localhost:6379` in your `.env`.

## Step 12: MongoDB Backups

Configure automated backups in MongoDB Atlas. Export the backup schedule to match your institutional requirements.

## Health Check

```bash
curl https://api.campusvoice.example.com/api/health
```

## Rollback

```bash
pm2 reset campusvoice-backend
pm2 reload campusvoice-backend --update-env
```

## Security Checklist

- [ ] `.env` files not in version control
- [ ] MongoDB Atlas IP whitelist configured
- [ ] Strong JWT secrets (32+ random characters)
- [ ] HTTPS enabled via Certbot
- [ ] Default admin password changed
- [ ] Rate limiting enabled
- [ ] Account lockout configured
- [ ] Audit logging enabled
- [ ] Regular database backups scheduled
