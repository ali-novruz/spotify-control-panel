# 🎵 Spotify Control Backend

Backend authentication service for Spotify Control Panel VS Code Extension.

## 🚀 Features

- OAuth 2.0 authentication proxy
- Secure token management
- Automatic token refresh
- Session management with JWT
- No user setup required

## 📋 Prerequisites

- Node.js 18+
- Spotify Developer App
- Digital Ocean (or any Node.js hosting)

## 🛠️ Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy `env.example` to `.env`:
```bash
cp env.example .env
```

Edit `.env`:
```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
BACKEND_URL=https://your-domain.com
JWT_SECRET=generate_random_secret
PORT=3000
```

### 3. Create Spotify App

1. Go to https://developer.spotify.com/dashboard
2. Create an app
3. Add Redirect URI: `https://your-domain.com/auth/callback`
4. Copy Client ID and Secret to `.env`

### 4. Run Locally

```bash
npm run dev
```

Server runs on `http://localhost:3000`

## 🌐 Deploy to Digital Ocean

### Option 1: App Platform (Easiest)

1. Push code to GitHub
2. Go to Digital Ocean App Platform
3. Create new app from GitHub repo
4. Set environment variables
5. Deploy!

### Option 2: Droplet (More Control)

```bash
# SSH into your droplet
ssh root@your-droplet-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Clone your repo
git clone your-repo-url
cd spotify-control-backend/backend

# Install dependencies
npm install

# Create .env file
nano .env
# Paste your environment variables

# Start with PM2
pm2 start server.js --name spotify-backend
pm2 save
pm2 startup
```

### Setup Nginx (for HTTPS)

```bash
# Install Nginx
sudo apt install nginx

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx

# Configure Nginx
sudo nano /etc/nginx/sites-available/spotify-backend
```

Nginx config:
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
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/spotify-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## 🔒 Security

- JWT tokens for session management
- Tokens stored server-side
- HTTPS required in production
- CORS configured
- Rate limiting recommended (add express-rate-limit)

## 📡 API Endpoints

### GET /health
Health check

### GET /auth/start
Start OAuth flow
Returns: `{ authUrl, state }`

### GET /auth/callback
OAuth callback (handled by Spotify)

### POST /auth/verify
Verify session token and get access token
Body: `{ sessionToken }`
Returns: `{ access_token, expires_at }`

### POST /auth/logout
Logout and invalidate session
Body: `{ sessionToken }`

## 🧪 Testing

```bash
# Health check
curl https://your-domain.com/health

# Start auth flow
curl https://your-domain.com/auth/start
```

## 📊 Monitoring

```bash
# View PM2 logs
pm2 logs spotify-backend

# Monitor
pm2 monit

# Restart
pm2 restart spotify-backend
```

## 🔄 Updates

```bash
# Pull latest code
git pull

# Install dependencies
npm install

# Restart
pm2 restart spotify-backend
```

## ⚠️ Production Considerations

1. **Database**: Replace in-memory Map with Redis/MongoDB
2. **Rate Limiting**: Add express-rate-limit
3. **Logging**: Add winston or pino
4. **Monitoring**: Add Sentry or similar
5. **Backup**: Regular token backup
6. **Scaling**: Use Redis for session storage

## 🐛 Troubleshooting

### "EADDRINUSE: address already in use"
Port 3000 is taken. Change PORT in .env or kill the process.

### "Invalid redirect URI"
Make sure Redirect URI in Spotify Dashboard matches BACKEND_URL/auth/callback

### "JWT malformed"
JWT_SECRET changed. Users need to re-authenticate.

---

**Made with ❤️ for Spotify Control Panel**

