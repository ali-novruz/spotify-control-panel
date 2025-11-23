# 🌊 Digital Ocean Deployment Guide

Complete guide to deploy the backend on Digital Ocean.

---

## 🚀 Quick Deploy (App Platform - Easiest)

### Step 1: Push to GitHub

```bash
cd C:\Users\nevin\OneDrive\Desktop\spotextentions
git add backend/
git commit -m "Add backend authentication service"
git push origin main
```

### Step 2: Create App on Digital Ocean

1. Go to https://cloud.digitalocean.com/apps
2. Click **"Create App"**
3. Select **GitHub** as source
4. Choose your repository
5. Select branch: `main`
6. Source Directory: `/backend`
7. Click **"Next"**

### Step 3: Configure App

**Build Command**: `npm install`  
**Run Command**: `npm start`  
**HTTP Port**: `3000`

### Step 4: Add Environment Variables

Click **"Edit"** next to Environment Variables:

```
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
BACKEND_URL=${APP_URL}
JWT_SECRET=generate_random_32_char_string
PORT=3000
```

Generate JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Configure Spotify Redirect URI

1. Go to https://developer.spotify.com/dashboard
2. Open your Spotify app
3. Click **"Edit Settings"**
4. Add Redirect URI: `https://your-app-name.ondigitalocean.app/auth/callback`
5. Click **"Save"**

### Step 6: Deploy!

Click **"Create Resources"**

Wait 2-3 minutes for deployment.

Your backend will be live at: `https://your-app-name.ondigitalocean.app`

---

## 🖥️ Manual Deploy (Droplet - More Control)

### Step 1: Create Droplet

1. Go to https://cloud.digitalocean.com/droplets
2. Click **"Create Droplet"**
3. Choose:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic ($6/month is enough)
   - **Datacenter**: Closest to your users
   - **Authentication**: SSH key (recommended)
4. Click **"Create Droplet"**

### Step 2: SSH into Droplet

```bash
ssh root@your-droplet-ip
```

### Step 3: Install Node.js

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verify
node --version
npm --version
```

### Step 4: Install PM2

```bash
npm install -g pm2
```

### Step 5: Clone Your Repository

```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/spotify-control-panel.git
cd spotify-control-panel/backend
```

### Step 6: Install Dependencies

```bash
npm install --production
```

### Step 7: Create .env File

```bash
nano .env
```

Paste:
```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
BACKEND_URL=https://your-domain.com
JWT_SECRET=your_random_jwt_secret
PORT=3000
```

Save: `Ctrl+X`, `Y`, `Enter`

### Step 8: Start with PM2

```bash
pm2 start server.js --name spotify-backend
pm2 save
pm2 startup
```

Copy and run the command PM2 shows.

### Step 9: Install Nginx

```bash
apt install nginx -y
```

### Step 10: Configure Nginx

```bash
nano /etc/nginx/sites-available/spotify-backend
```

Paste:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/spotify-backend /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 11: Install SSL Certificate

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get certificate
certbot --nginx -d your-domain.com

# Follow prompts, choose redirect HTTP to HTTPS
```

### Step 12: Configure Firewall

```bash
ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw enable
```

### Step 13: Test Backend

```bash
curl https://your-domain.com/health
```

Should return: `{"status":"ok","message":"Spotify Auth Backend is running"}`

---

## 🔄 Update Deployment

### App Platform

```bash
git add .
git commit -m "Update backend"
git push origin main
```

App Platform auto-deploys on push!

### Droplet

```bash
ssh root@your-droplet-ip
cd /var/www/spotify-control-panel/backend
git pull
npm install
pm2 restart spotify-backend
```

---

## 📊 Monitoring

### App Platform

- Go to your app dashboard
- Check **"Runtime Logs"**
- Check **"Insights"** for metrics

### Droplet

```bash
# View logs
pm2 logs spotify-backend

# Monitor
pm2 monit

# Status
pm2 status

# Restart
pm2 restart spotify-backend

# Stop
pm2 stop spotify-backend
```

---

## 💰 Cost Estimate

### App Platform
- **Basic Plan**: $5/month
- **Includes**: 512MB RAM, automatic scaling
- **Best for**: Simple deployment

### Droplet
- **Basic**: $6/month (1GB RAM)
- **Recommended**: $12/month (2GB RAM)
- **Best for**: More control, multiple services

---

## 🐛 Troubleshooting

### "Cannot connect to backend"
- Check if service is running: `pm2 status`
- Check logs: `pm2 logs`
- Check firewall: `ufw status`

### "502 Bad Gateway"
- Backend not running: `pm2 restart spotify-backend`
- Check Nginx config: `nginx -t`
- Check backend port: `netstat -tlnp | grep 3000`

### "SSL certificate error"
- Renew certificate: `certbot renew`
- Check certificate: `certbot certificates`

### "High memory usage"
- Restart PM2: `pm2 restart all`
- Check logs for errors
- Consider upgrading droplet

---

## 🔒 Security Checklist

- [ ] Firewall enabled (ufw)
- [ ] SSH key authentication
- [ ] SSL certificate installed
- [ ] Environment variables secured
- [ ] Regular updates: `apt update && apt upgrade`
- [ ] PM2 monitoring enabled
- [ ] Nginx rate limiting (optional)
- [ ] Fail2ban installed (optional)

---

## 📝 Maintenance

### Weekly
- Check logs: `pm2 logs`
- Monitor disk space: `df -h`

### Monthly
- Update system: `apt update && apt upgrade`
- Check SSL expiry: `certbot certificates`
- Review PM2 logs

### As Needed
- Restart services: `pm2 restart all`
- Clear logs: `pm2 flush`
- Update code: `git pull && pm2 restart all`

---

**Your backend is now live! 🎉**

Next: Update extension with your backend URL!

