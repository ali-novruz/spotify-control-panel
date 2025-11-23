import * as vscode from 'vscode';
import * as http from 'http';
import axios from 'axios';
import { SpotifyTokens } from './types';

/**
 * Handles Spotify OAuth 2.0 authentication flow
 */
export class SpotifyAuth {
  private static readonly TOKEN_KEY = 'spotify_tokens';
  private static readonly SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
  private static readonly SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
  private static readonly SCOPES = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
  ].join(' ');

  constructor(private context: vscode.ExtensionContext) {}

  /**
   * Get the client ID from settings
   */
  private getClientId(): string {
    const config = vscode.workspace.getConfiguration('spotify');
    const clientId = config.get<string>('clientId', '');
    if (!clientId) {
      throw new Error('Spotify Client ID not configured. Please set it in settings.');
    }
    return clientId;
  }

  /**
   * Get the client secret from settings
   */
  private getClientSecret(): string {
    const config = vscode.workspace.getConfiguration('spotify');
    const clientSecret = config.get<string>('clientSecret', '');
    if (!clientSecret) {
      throw new Error('Spotify Client Secret not configured. Please set it in settings.');
    }
    return clientSecret;
  }

  /**
   * Get the redirect URI from settings
   */
  private getRedirectUri(): string {
    const config = vscode.workspace.getConfiguration('spotify');
    return config.get<string>('redirectUri', 'http://localhost:8888/callback');
  }

  /**
   * Start the OAuth flow and authenticate the user
   */
  async authenticate(): Promise<SpotifyTokens> {
    const clientId = this.getClientId();
    const redirectUri = this.getRedirectUri();

    // Generate a random state for security
    const state = this.generateRandomString(16);

    // Build the authorization URL
    const authUrl = `${SpotifyAuth.SPOTIFY_AUTH_URL}?${new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: SpotifyAuth.SCOPES,
      redirect_uri: redirectUri,
      state: state,
    })}`;

    // Start local server to receive the callback
    const authCode = await this.startLocalServer(redirectUri, state);

    // Exchange authorization code for tokens
    const tokens = await this.exchangeCodeForTokens(authCode);

    // Store tokens securely
    await this.storeTokens(tokens);

    return tokens;
  }

  /**
   * Start a local HTTP server to receive the OAuth callback
   */
  private startLocalServer(redirectUri: string, expectedState: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const url = new URL(redirectUri);
      const port = parseInt(url.port) || 8888;

      const server = http.createServer((req, res) => {
        if (!req.url) {
          return;
        }

        const reqUrl = new URL(req.url, `http://localhost:${port}`);
        const code = reqUrl.searchParams.get('code');
        const state = reqUrl.searchParams.get('state');
        const error = reqUrl.searchParams.get('error');

        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`<h1>Authentication failed</h1><p>Error: ${error}</p>`);
          server.close();
          reject(new Error(`Authentication failed: ${error}`));
          return;
        }

        if (code && state === expectedState) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <h1>Authentication successful!</h1>
            <p>You can close this window and return to VS Code.</p>
            <script>window.close();</script>
          `);
          server.close();
          resolve(code);
        } else {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<h1>Authentication failed</h1><p>Invalid state or missing code.</p>');
          server.close();
          reject(new Error('Invalid state or missing code'));
        }
      });

      server.listen(port, () => {
        vscode.env.openExternal(vscode.Uri.parse(
          `${SpotifyAuth.SPOTIFY_AUTH_URL}?${new URLSearchParams({
            response_type: 'code',
            client_id: this.getClientId(),
            scope: SpotifyAuth.SCOPES,
            redirect_uri: redirectUri,
            state: expectedState,
          })}`
        ));
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        server.close();
        reject(new Error('Authentication timeout'));
      }, 5 * 60 * 1000);
    });
  }

  /**
   * Exchange authorization code for access and refresh tokens
   */
  private async exchangeCodeForTokens(code: string): Promise<SpotifyTokens> {
    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();
    const redirectUri = this.getRedirectUri();

    const response = await axios.post(
      SpotifyAuth.SPOTIFY_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
      }
    );

    const tokens: SpotifyTokens = {
      ...response.data,
      expires_at: Date.now() + response.data.expires_in * 1000,
    };

    return tokens;
  }

  /**
   * Refresh the access token using the refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<SpotifyTokens> {
    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();

    const response = await axios.post(
      SpotifyAuth.SPOTIFY_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
      }
    );

    const tokens: SpotifyTokens = {
      ...response.data,
      refresh_token: refreshToken, // Keep the old refresh token if not provided
      expires_at: Date.now() + response.data.expires_in * 1000,
    };

    await this.storeTokens(tokens);
    return tokens;
  }

  /**
   * Store tokens securely using VS Code's SecretStorage
   */
  private async storeTokens(tokens: SpotifyTokens): Promise<void> {
    await this.context.secrets.store(SpotifyAuth.TOKEN_KEY, JSON.stringify(tokens));
  }

  /**
   * Retrieve stored tokens
   */
  async getStoredTokens(): Promise<SpotifyTokens | null> {
    const tokensJson = await this.context.secrets.get(SpotifyAuth.TOKEN_KEY);
    if (!tokensJson) {
      return null;
    }
    return JSON.parse(tokensJson);
  }

  /**
   * Check if tokens are valid (not expired)
   */
  async isAuthenticated(): Promise<boolean> {
    const tokens = await this.getStoredTokens();
    if (!tokens) {
      return false;
    }
    return Date.now() < tokens.expires_at;
  }

  /**
   * Get valid access token, refreshing if necessary
   */
  async getValidAccessToken(): Promise<string | null> {
    let tokens = await this.getStoredTokens();
    if (!tokens) {
      return null;
    }

    // Check if token is expired or about to expire (within 5 minutes)
    if (Date.now() >= tokens.expires_at - 5 * 60 * 1000) {
      try {
        tokens = await this.refreshAccessToken(tokens.refresh_token);
      } catch (error) {
        console.error('Failed to refresh token:', error);
        return null;
      }
    }

    return tokens.access_token;
  }

  /**
   * Clear stored tokens (logout)
   */
  async logout(): Promise<void> {
    await this.context.secrets.delete(SpotifyAuth.TOKEN_KEY);
  }

  /**
   * Generate a random string for state parameter
   */
  private generateRandomString(length: number): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}

