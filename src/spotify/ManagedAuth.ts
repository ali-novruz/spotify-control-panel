import * as vscode from 'vscode';
import axios from 'axios';

/**
 * Managed authentication using backend service
 * Users don't need to create their own Spotify app
 */
export class ManagedAuth {
  private static readonly SESSION_TOKEN_KEY = 'spotify_managed_session';
  private static readonly BACKEND_URL = 'https://urchin-app-hs7am.ondigitalocean.app';

  constructor(private context: vscode.ExtensionContext) {}

  /**
   * Start managed authentication flow
   */
  async authenticate(): Promise<void> {
    try {
      // Get authorization URL from backend
      const response = await axios.get(`${ManagedAuth.BACKEND_URL}/auth/start`);
      const { authUrl, state } = response.data;

      // Open browser for user to authorize
      await vscode.env.openExternal(vscode.Uri.parse(authUrl));

      // Show input box for session token
      const sessionToken = await vscode.window.showInputBox({
        prompt: 'Paste the session token from the browser',
        placeHolder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        ignoreFocusOut: true,
        password: true,
      });

      if (!sessionToken) {
        throw new Error('Authentication cancelled');
      }

      // Verify token with backend
      await this.verifyToken(sessionToken);

      // Store session token
      await this.context.secrets.store(ManagedAuth.SESSION_TOKEN_KEY, sessionToken);

      vscode.window.showInformationMessage('✅ Successfully authenticated with Spotify!');

    } catch (error: any) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Verify session token and get access token
   */
  private async verifyToken(sessionToken: string): Promise<void> {
    try {
      const response = await axios.post(`${ManagedAuth.BACKEND_URL}/auth/verify`, {
        sessionToken,
      });

      if (!response.data.access_token) {
        throw new Error('Invalid session token');
      }
    } catch (error: any) {
      console.error('Verify token error:', error.response?.data || error.message);
      
      // If session not found, clear the stored token
      if (error.response?.status === 401 || error.response?.data?.error?.includes('Session not found')) {
        await this.context.secrets.delete(ManagedAuth.SESSION_TOKEN_KEY);
      }
      
      throw new Error(error.response?.data?.error || error.message);
    }
  }

  /**
   * Get valid access token from backend
   */
  async getValidAccessToken(): Promise<string | null> {
    const sessionToken = await this.context.secrets.get(ManagedAuth.SESSION_TOKEN_KEY);
    
    if (!sessionToken) {
      console.log('No session token found in storage');
      return null;
    }

    try {
      console.log('Verifying session token with backend...');
      const response = await axios.post(`${ManagedAuth.BACKEND_URL}/auth/verify`, {
        sessionToken,
      });

      console.log('Access token received successfully');
      return response.data.access_token;

    } catch (error: any) {
      console.error('Failed to get access token:', error.response?.data || error.message);
      
      // If session not found or expired, clear the stored token
      if (error.response?.status === 401 || error.response?.data?.error?.includes('Session not found')) {
        console.log('Session expired or invalid, clearing stored token');
        await this.context.secrets.delete(ManagedAuth.SESSION_TOKEN_KEY);
      }
      
      return null;
    }
  }

  /**
   * Check if user is authenticated (quick check - just checks if token exists)
   */
  async isAuthenticated(): Promise<boolean> {
    const sessionToken = await this.context.secrets.get(ManagedAuth.SESSION_TOKEN_KEY);
    return sessionToken !== null && sessionToken !== undefined;
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    const sessionToken = await this.context.secrets.get(ManagedAuth.SESSION_TOKEN_KEY);
    
    if (sessionToken) {
      try {
        // Notify backend
        await axios.post(`${ManagedAuth.BACKEND_URL}/auth/logout`, {
          sessionToken,
        });
      } catch (error) {
        // Ignore errors, just clear local token
      }
    }

    await this.context.secrets.delete(ManagedAuth.SESSION_TOKEN_KEY);
  }
}

