const express = require('express');
const axios = require('axios');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory token storage (production'da database kullan)
const tokenStore = new Map();

// Spotify API credentials (environment variables'dan al)
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

// Spotify API endpoints
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

// Scopes needed
const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
].join(' ');

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Spotify Auth Backend is running' });
});

/**
 * Start OAuth flow
 * Returns authorization URL for the extension to open
 */
app.get('/auth/start', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  
  // Store state temporarily (expires in 10 minutes)
  tokenStore.set(`state:${state}`, { timestamp: Date.now(), expiresAt: Date.now() + 10 * 60 * 1000 });
  
  const authUrl = `${SPOTIFY_AUTH_URL}?${new URLSearchParams({
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    scope: SCOPES,
    redirect_uri: `${BACKEND_URL}/auth/callback`,
    state: state,
  })}`;
  
  res.json({ authUrl, state });
});

/**
 * OAuth callback endpoint
 * Spotify redirects here after user authorization
 */
app.get('/auth/callback', async (req, res) => {
  const { code, state, error } = req.query;
  
  if (error) {
    return res.send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>❌ Authentication Failed</h1>
          <p>Error: ${error}</p>
          <p>You can close this window.</p>
        </body>
      </html>
    `);
  }
  
  if (!code || !state) {
    return res.status(400).send('Missing code or state');
  }
  
  // Verify state
  const storedState = tokenStore.get(`state:${state}`);
  if (!storedState) {
    return res.status(400).send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>❌ Invalid State</h1>
          <p>Authentication session expired or invalid.</p>
          <p>Please try authenticating again from VS Code.</p>
          <button onclick="window.close()" style="padding: 10px 20px; background: #1DB954; color: white; border: none; border-radius: 5px; cursor: pointer;">Close Window</button>
        </body>
      </html>
    `);
  }
  
  // Check if state expired
  if (Date.now() > storedState.expiresAt) {
    tokenStore.delete(`state:${state}`);
    return res.status(400).send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>⏰ Session Expired</h1>
          <p>Authentication took too long (max 10 minutes).</p>
          <p>Please try authenticating again from VS Code.</p>
          <button onclick="window.close()" style="padding: 10px 20px; background: #1DB954; color: white; border: none; border-radius: 5px; cursor: pointer;">Close Window</button>
        </body>
      </html>
    `);
  }
  
  // Clean up state
  tokenStore.delete(`state:${state}`);
  
  try {
    // Exchange code for tokens
    const response = await axios.post(
      SPOTIFY_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${BACKEND_URL}/auth/callback`,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
        },
      }
    );
    
    const { access_token, refresh_token, expires_in } = response.data;
    
    // Generate session token for the extension
    const sessionToken = jwt.sign(
      { 
        spotify_access: access_token,
        spotify_refresh: refresh_token,
        expires_at: Date.now() + expires_in * 1000
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // Store tokens
    tokenStore.set(`session:${sessionToken}`, {
      access_token,
      refresh_token,
      expires_at: Date.now() + expires_in * 1000,
    });
    
    console.log('✅ Token stored successfully. Total sessions:', Array.from(tokenStore.keys()).filter(k => k.startsWith('session:')).length);
    
    // Return success page with session token
    res.send(`
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
              text-align: center;
              padding: 50px;
              background: linear-gradient(135deg, #1DB954 0%, #191414 100%);
              color: white;
            }
            .container {
              background: rgba(255, 255, 255, 0.1);
              padding: 40px;
              border-radius: 10px;
              max-width: 500px;
              margin: 0 auto;
            }
            h1 { font-size: 48px; margin: 0; }
            .token {
              background: rgba(0, 0, 0, 0.3);
              padding: 15px;
              border-radius: 5px;
              word-break: break-all;
              margin: 20px 0;
              font-family: monospace;
              font-size: 12px;
            }
            button {
              background: #1DB954;
              color: white;
              border: none;
              padding: 15px 30px;
              border-radius: 25px;
              font-size: 16px;
              cursor: pointer;
              margin: 10px;
            }
            button:hover { background: #1ed760; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Success!</h1>
            <p>You've successfully authenticated with Spotify!</p>
            <p>Copy this token and paste it in VS Code:</p>
            <div class="token" id="token">${sessionToken}</div>
            <button onclick="copyToken()">📋 Copy Token</button>
            <button onclick="window.close()">Close Window</button>
            <p style="font-size: 12px; opacity: 0.7; margin-top: 20px;">
              This token will be automatically copied to your clipboard.
            </p>
          </div>
          <script>
            function copyToken() {
              const token = document.getElementById('token').innerText;
              navigator.clipboard.writeText(token).then(() => {
                alert('Token copied to clipboard! Paste it in VS Code.');
              });
            }
            // Auto-copy on load
            copyToken();
          </script>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Token exchange error:', error.response?.data || error.message);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>❌ Authentication Error</h1>
          <p>Failed to exchange authorization code for tokens.</p>
          <p>Error: ${error.message}</p>
        </body>
      </html>
    `);
  }
});

/**
 * Verify session token and get access token
 */
app.post('/auth/verify', async (req, res) => {
  const { sessionToken } = req.body;
  
  if (!sessionToken) {
    return res.status(400).json({ error: 'Missing session token' });
  }
  
  try {
    // Verify JWT
    const decoded = jwt.verify(sessionToken, JWT_SECRET);
    
    // Get stored tokens
    const tokens = tokenStore.get(`session:${sessionToken}`);
    if (!tokens) {
      console.error('Session not found. Available sessions:', Array.from(tokenStore.keys()).filter(k => k.startsWith('session:')).length);
      return res.status(401).json({ error: 'Session not found' });
    }
    
    // Check if access token is expired
    if (Date.now() >= tokens.expires_at - 5 * 60 * 1000) {
      // Refresh token
      const refreshed = await refreshAccessToken(tokens.refresh_token);
      tokens.access_token = refreshed.access_token;
      tokens.expires_at = Date.now() + refreshed.expires_in * 1000;
      tokenStore.set(`session:${sessionToken}`, tokens);
    }
    
    res.json({
      access_token: tokens.access_token,
      expires_at: tokens.expires_at,
    });
    
  } catch (error) {
    console.error('Verify error:', error.message);
    res.status(401).json({ error: 'Invalid or expired session token' });
  }
});

/**
 * Refresh Spotify access token
 */
async function refreshAccessToken(refreshToken) {
  const response = await axios.post(
    SPOTIFY_TOKEN_URL,
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
      },
    }
  );
  
  return response.data;
}

/**
 * Logout endpoint
 */
app.post('/auth/logout', (req, res) => {
  const { sessionToken } = req.body;
  
  if (sessionToken) {
    tokenStore.delete(`session:${sessionToken}`);
  }
  
  res.json({ message: 'Logged out successfully' });
});

/**
 * Cleanup expired states (run every 5 minutes)
 */
setInterval(() => {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  
  for (const [key, value] of tokenStore.entries()) {
    if (key.startsWith('state:') && now - value.timestamp > fiveMinutes) {
      tokenStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Spotify Auth Backend running on port ${PORT}`);
  console.log(`📍 Backend URL: ${BACKEND_URL}`);
  console.log(`🔑 Client ID: ${SPOTIFY_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`🔑 Client Secret: ${SPOTIFY_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`🔐 JWT Secret: ${JWT_SECRET ? '✅ Set' : '❌ Missing'} (${JWT_SECRET ? JWT_SECRET.substring(0, 8) + '...' : 'N/A'})`);
});

