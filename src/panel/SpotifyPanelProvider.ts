import * as vscode from 'vscode';
import { SpotifyClient } from '../spotify/SpotifyClient';
import { SpotifyAuth } from '../spotify/SpotifyAuth';

/**
 * Provider for the Spotify Control Panel WebviewView
 */
export class SpotifyPanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'spotifyControlPanel';
  private _view?: vscode.WebviewView;
  private _updateInterval?: NodeJS.Timeout;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private spotifyClient: SpotifyClient,
    private spotifyAuth: SpotifyAuth
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'playPause':
          await this.handlePlayPause();
          break;
        case 'next':
          await this.handleNext();
          break;
        case 'previous':
          await this.handlePrevious();
          break;
        case 'seek':
          await this.handleSeek(data.positionMs);
          break;
        case 'seekForward':
          await this.handleSeekForward();
          break;
        case 'seekBackward':
          await this.handleSeekBackward();
          break;
        case 'toggleShuffle':
          await this.handleToggleShuffle();
          break;
        case 'toggleRepeat':
          await this.handleToggleRepeat();
          break;
        case 'refresh':
          await this.updatePlaybackState();
          break;
        case 'authenticate':
          await this.handleAuthenticate();
          break;
      }
    });

    // Start periodic updates
    this.startPeriodicUpdates();

    // Initial update
    this.updatePlaybackState();
  }

  /**
   * Start periodic updates of playback state
   */
  private startPeriodicUpdates() {
    const config = vscode.workspace.getConfiguration('spotify');
    const interval = config.get<number>('refreshInterval', 1000);

    if (this._updateInterval) {
      clearInterval(this._updateInterval);
    }

    this._updateInterval = setInterval(() => {
      this.updatePlaybackState();
    }, interval);
  }

  /**
   * Stop periodic updates
   */
  public stopPeriodicUpdates() {
    if (this._updateInterval) {
      clearInterval(this._updateInterval);
      this._updateInterval = undefined;
    }
  }

  /**
   * Update the webview with current playback state
   */
  private async updatePlaybackState() {
    if (!this._view) {
      return;
    }

    try {
      const isAuthenticated = await this.spotifyAuth.isAuthenticated();
      if (!isAuthenticated) {
        this._view.webview.postMessage({
          type: 'notAuthenticated',
        });
        return;
      }

      const trackInfo = await this.spotifyClient.getCurrentTrack();
      if (!trackInfo) {
        this._view.webview.postMessage({
          type: 'noPlayback',
        });
        return;
      }

      this._view.webview.postMessage({
        type: 'update',
        data: trackInfo,
      });
    } catch (error: any) {
      this._view.webview.postMessage({
        type: 'error',
        message: error.message || 'Failed to fetch playback state',
      });
    }
  }

  /**
   * Handle play/pause button
   */
  private async handlePlayPause() {
    try {
      await this.spotifyClient.togglePlayPause();
      // Update immediately after action
      setTimeout(() => this.updatePlaybackState(), 300);
    } catch (error: any) {
      vscode.window.showErrorMessage(`Spotify: ${error.message}`);
    }
  }

  /**
   * Handle next track button
   */
  private async handleNext() {
    try {
      await this.spotifyClient.nextTrack();
      setTimeout(() => this.updatePlaybackState(), 300);
    } catch (error: any) {
      vscode.window.showErrorMessage(`Spotify: ${error.message}`);
    }
  }

  /**
   * Handle previous track button
   */
  private async handlePrevious() {
    try {
      await this.spotifyClient.previousTrack();
      setTimeout(() => this.updatePlaybackState(), 300);
    } catch (error: any) {
      vscode.window.showErrorMessage(`Spotify: ${error.message}`);
    }
  }

  /**
   * Handle seek to position
   */
  private async handleSeek(positionMs: number) {
    try {
      await this.spotifyClient.seek(positionMs);
      setTimeout(() => this.updatePlaybackState(), 300);
    } catch (error: any) {
      vscode.window.showErrorMessage(`Spotify: ${error.message}`);
    }
  }

  /**
   * Handle seek forward
   */
  private async handleSeekForward() {
    try {
      await this.spotifyClient.seekForward(10);
      setTimeout(() => this.updatePlaybackState(), 300);
    } catch (error: any) {
      vscode.window.showErrorMessage(`Spotify: ${error.message}`);
    }
  }

  /**
   * Handle seek backward
   */
  private async handleSeekBackward() {
    try {
      await this.spotifyClient.seekBackward(10);
      setTimeout(() => this.updatePlaybackState(), 300);
    } catch (error: any) {
      vscode.window.showErrorMessage(`Spotify: ${error.message}`);
    }
  }

  /**
   * Handle toggle shuffle
   */
  private async handleToggleShuffle() {
    try {
      await this.spotifyClient.toggleShuffle();
      setTimeout(() => this.updatePlaybackState(), 300);
    } catch (error: any) {
      vscode.window.showErrorMessage(`Spotify: ${error.message}`);
    }
  }

  /**
   * Handle toggle repeat
   */
  private async handleToggleRepeat() {
    try {
      await this.spotifyClient.toggleRepeat();
      setTimeout(() => this.updatePlaybackState(), 300);
    } catch (error: any) {
      vscode.window.showErrorMessage(`Spotify: ${error.message}`);
    }
  }

  /**
   * Handle authentication
   */
  private async handleAuthenticate() {
    try {
      await vscode.commands.executeCommand('spotify.authenticate');
      setTimeout(() => this.updatePlaybackState(), 500);
    } catch (error: any) {
      vscode.window.showErrorMessage(`Spotify: ${error.message}`);
    }
  }

  /**
   * Generate HTML for the webview
   */
  private _getHtmlForWebview(webview: vscode.Webview) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Spotify Control Panel</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      padding: 16px;
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
    }

    .container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .album-art {
      width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
      border-radius: 8px;
      background: var(--vscode-input-background);
    }

    .track-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .track-name {
      font-size: 16px;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .artist-name {
      font-size: 14px;
      opacity: 0.8;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .album-name {
      font-size: 12px;
      opacity: 0.6;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .progress-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .progress-bar {
      width: 100%;
      height: 4px;
      background: var(--vscode-input-background);
      border-radius: 2px;
      overflow: hidden;
      cursor: pointer;
      position: relative;
    }

    .progress-fill {
      height: 100%;
      background: var(--vscode-button-background);
      transition: width 0.1s linear;
    }

    .progress-time {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      opacity: 0.6;
    }

    .controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
    }

    .control-btn {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .control-btn:hover {
      opacity: 0.8;
    }

    .control-btn:active {
      opacity: 0.6;
    }

    .control-btn.play-pause {
      width: 48px;
      height: 48px;
    }

    .secondary-controls {
      display: flex;
      justify-content: space-around;
      gap: 8px;
    }

    .secondary-btn {
      background: transparent;
      color: var(--vscode-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 12px;
      flex: 1;
      transition: background 0.2s;
    }

    .secondary-btn:hover {
      background: var(--vscode-input-background);
    }

    .secondary-btn.active {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border-color: var(--vscode-button-background);
    }

    .message {
      text-align: center;
      padding: 24px;
      opacity: 0.7;
    }

    .auth-button {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      padding: 12px 24px;
      cursor: pointer;
      font-size: 14px;
      width: 100%;
      margin-top: 8px;
    }

    .auth-button:hover {
      opacity: 0.9;
    }

    .error {
      color: var(--vscode-errorForeground);
      font-size: 12px;
      text-align: center;
      padding: 8px;
      background: var(--vscode-inputValidation-errorBackground);
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container" id="app">
    <div class="message">Loading...</div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let currentTrack = null;

    // Listen for messages from the extension
    window.addEventListener('message', event => {
      const message = event.data;
      
      switch (message.type) {
        case 'update':
          currentTrack = message.data;
          renderPlayer(message.data);
          break;
        case 'notAuthenticated':
          renderAuthPrompt();
          break;
        case 'noPlayback':
          renderNoPlayback();
          break;
        case 'error':
          renderError(message.message);
          break;
      }
    });

    function renderPlayer(track) {
      const app = document.getElementById('app');
      const progressPercent = (track.progressMs / track.durationMs) * 100;
      
      app.innerHTML = \`
        <img class="album-art" src="\${track.albumArt}" alt="Album art" onerror="this.style.display='none'">
        
        <div class="track-info">
          <div class="track-name" title="\${track.trackName}">\${track.trackName}</div>
          <div class="artist-name" title="\${track.artistName}">\${track.artistName}</div>
          <div class="album-name" title="\${track.albumName}">\${track.albumName}</div>
        </div>

        <div class="progress-container">
          <div class="progress-bar" onclick="seekToPosition(event)">
            <div class="progress-fill" style="width: \${progressPercent}%"></div>
          </div>
          <div class="progress-time">
            <span>\${formatTime(track.progressMs)}</span>
            <span>\${formatTime(track.durationMs)}</span>
          </div>
        </div>

        <div class="controls">
          <button class="control-btn" onclick="sendMessage('seekBackward')" title="Seek backward 10s">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
              <text x="12" y="16" text-anchor="middle" font-size="8" fill="currentColor">10</text>
            </svg>
          </button>
          
          <button class="control-btn" onclick="sendMessage('previous')" title="Previous track">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>
          
          <button class="control-btn play-pause" onclick="sendMessage('playPause')" title="\${track.isPlaying ? 'Pause' : 'Play'}">
            \${track.isPlaying ? 
              '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>' :
              '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'
            }
          </button>
          
          <button class="control-btn" onclick="sendMessage('next')" title="Next track">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>

          <button class="control-btn" onclick="sendMessage('seekForward')" title="Seek forward 10s">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
              <text x="12" y="16" text-anchor="middle" font-size="8" fill="currentColor">10</text>
            </svg>
          </button>
        </div>

        <div class="secondary-controls">
          <button class="secondary-btn \${track.shuffleState ? 'active' : ''}" onclick="sendMessage('toggleShuffle')" title="Toggle shuffle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
            </svg>
          </button>
          
          <button class="secondary-btn \${track.repeatState !== 'off' ? 'active' : ''}" onclick="sendMessage('toggleRepeat')" title="Toggle repeat (\${track.repeatState})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
              \${track.repeatState === 'track' ? '<text x="12" y="16" text-anchor="middle" font-size="10" fill="currentColor">1</text>' : ''}
            </svg>
          </button>
        </div>
      \`;
    }

    function renderAuthPrompt() {
      const app = document.getElementById('app');
      app.innerHTML = \`
        <div class="message">
          <p>Please authenticate with Spotify to use the control panel.</p>
          <button class="auth-button" onclick="sendMessage('authenticate')">
            Login with Spotify
          </button>
        </div>
      \`;
    }

    function renderNoPlayback() {
      const app = document.getElementById('app');
      app.innerHTML = \`
        <div class="message">
          <p>No active playback found.</p>
          <p style="font-size: 12px; margin-top: 8px;">Start playing music on Spotify.</p>
        </div>
      \`;
    }

    function renderError(message) {
      const app = document.getElementById('app');
      app.innerHTML = \`
        <div class="error">\${message}</div>
        <button class="auth-button" onclick="sendMessage('refresh')" style="margin-top: 16px;">
          Retry
        </button>
      \`;
    }

    function sendMessage(type, data = {}) {
      vscode.postMessage({ type, ...data });
    }

    function formatTime(ms) {
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return \`\${minutes}:\${seconds.toString().padStart(2, '0')}\`;
    }

    function seekToPosition(event) {
      if (!currentTrack) return;
      
      const progressBar = event.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const percent = clickX / rect.width;
      const positionMs = Math.floor(percent * currentTrack.durationMs);
      
      sendMessage('seek', { positionMs });
    }

    // Request initial update
    sendMessage('refresh');
  </script>
</body>
</html>`;
  }
}

