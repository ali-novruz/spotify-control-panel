import * as vscode from 'vscode';
import { SpotifyClient } from '../spotify/SpotifyClient';
import { ManagedAuth } from '../spotify/ManagedAuth';

/**
 * Spotify Status Bar Controller
 * Shows current track and controls in the status bar
 */
export class SpotifyStatusBar {
  private trackItem: vscode.StatusBarItem;
  private playPauseItem: vscode.StatusBarItem;
  private nextItem: vscode.StatusBarItem;
  private previousItem: vscode.StatusBarItem;
  private shuffleItem: vscode.StatusBarItem;
  private repeatItem: vscode.StatusBarItem;
  private volumeItem: vscode.StatusBarItem;
  private logoutItem: vscode.StatusBarItem;
  private updateInterval?: NodeJS.Timeout;
  private currentVolume: number = 50;
  private lastError: string | null = null;

  constructor(
    private spotifyClient: SpotifyClient,
    private spotifyAuth: ManagedAuth
  ) {
    // Create status bar items (right to left order, priority determines position)
    this.trackItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.playPauseItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
    this.previousItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 98);
    this.nextItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 97);
    this.shuffleItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 96);
    this.repeatItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 95);
    this.volumeItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 94);
    this.logoutItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 93);

    // Set commands
    this.playPauseItem.command = 'spotify.playPause';
    this.nextItem.command = 'spotify.nextTrack';
    this.previousItem.command = 'spotify.previousTrack';
    this.shuffleItem.command = 'spotify.toggleShuffle';
    this.repeatItem.command = 'spotify.toggleRepeat';
    this.volumeItem.command = 'spotify.changeVolume';
    this.logoutItem.command = 'spotify.logout';

    // Set tooltips
    this.playPauseItem.tooltip = 'Play/Pause (Ctrl+Alt+Space)';
    this.nextItem.tooltip = 'Next Track (Ctrl+Alt+Right)';
    this.previousItem.tooltip = 'Previous Track (Ctrl+Alt+Left)';
    this.shuffleItem.tooltip = 'Toggle Shuffle';
    this.repeatItem.tooltip = 'Toggle Repeat';
    this.volumeItem.tooltip = 'Click to change volume';
    this.logoutItem.tooltip = 'Logout from Spotify';

    // Show all items
    this.show();

    // Start periodic updates
    this.startPeriodicUpdates();
  }

  /**
   * Show all status bar items
   */
  private show() {
    this.trackItem.show();
    this.playPauseItem.show();
    this.nextItem.show();
    this.previousItem.show();
    this.shuffleItem.show();
    this.repeatItem.show();
    this.volumeItem.show();
    this.logoutItem.show();
  }

  /**
   * Start periodic updates
   */
  private startPeriodicUpdates() {
    const config = vscode.workspace.getConfiguration('spotify');
    const interval = config.get<number>('refreshInterval', 3000);

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(() => {
      this.updateStatusBar();
    }, interval);

    // Initial update
    this.updateStatusBar();
  }

  /**
   * Force immediate refresh (public method)
   */
  public forceRefresh() {
    this.updateStatusBar();
  }

  /**
   * Update status bar with current track info
   */
  private async updateStatusBar() {
    try {
      const isAuthenticated = await this.spotifyAuth.isAuthenticated();
      if (!isAuthenticated) {
        this.trackItem.text = '$(music) Spotify: Not authenticated';
        this.trackItem.command = 'spotify.authenticate';
        this.trackItem.tooltip = 'Click to authenticate with Spotify';
        this.playPauseItem.hide();
        this.nextItem.hide();
        this.previousItem.hide();
        this.shuffleItem.hide();
        this.repeatItem.hide();
        this.volumeItem.hide();
        this.logoutItem.hide();
        return;
      }

      const trackInfo = await this.spotifyClient.getCurrentTrack();
      if (!trackInfo) {
        this.trackItem.text = '$(music) Spotify: No playback';
        this.trackItem.command = undefined;
        this.trackItem.tooltip = 'Start playing music on Spotify';
        this.playPauseItem.hide();
        this.nextItem.hide();
        this.previousItem.hide();
        this.shuffleItem.hide();
        this.repeatItem.hide();
        this.volumeItem.hide();
        this.logoutItem.show();
        this.logoutItem.text = '$(sign-out)';
        return;
      }

      // Show all controls
      this.playPauseItem.show();
      this.nextItem.show();
      this.previousItem.show();
      this.shuffleItem.show();
      this.repeatItem.show();
      this.volumeItem.show();
      this.logoutItem.show();
      this.logoutItem.text = '$(sign-out)';

      // Update track info
      const progress = this.formatTime(trackInfo.progressMs);
      const duration = this.formatTime(trackInfo.durationMs);
      this.trackItem.text = `$(music) ${trackInfo.trackName} - ${trackInfo.artistName} | ${progress}/${duration}`;
      this.trackItem.command = undefined;
      this.trackItem.tooltip = `${trackInfo.trackName}\n${trackInfo.artistName}\n${trackInfo.albumName}`;

      // Update play/pause button
      this.playPauseItem.text = trackInfo.isPlaying ? '$(debug-pause)' : '$(play)';

      // Update control buttons
      this.previousItem.text = '$(chevron-left)';
      this.nextItem.text = '$(chevron-right)';

      // Update shuffle button
      this.shuffleItem.text = trackInfo.shuffleState ? '$(symbol-misc)' : '$(symbol-misc)';
      this.shuffleItem.color = trackInfo.shuffleState ? '#1DB954' : undefined;

      // Update repeat button
      if (trackInfo.repeatState === 'track') {
        this.repeatItem.text = '$(sync) 1';
        this.repeatItem.color = '#1DB954';
      } else if (trackInfo.repeatState === 'context') {
        this.repeatItem.text = '$(sync)';
        this.repeatItem.color = '#1DB954';
      } else {
        this.repeatItem.text = '$(sync)';
        this.repeatItem.color = undefined;
      }

      // Update volume button
      const volumeIcon = this.currentVolume === 0 ? '$(mute)' : 
                        this.currentVolume < 30 ? '$(unmute)' : 
                        this.currentVolume < 70 ? '$(unmute)' : '$(unmute)';
      this.volumeItem.text = `${volumeIcon} ${this.currentVolume}%`;

    } catch (error: any) {
      // Only show error if it's different from last error (avoid spam)
      const errorMsg = error.message || 'Unknown error';
      if (this.lastError !== errorMsg) {
        console.error('Status bar update error:', errorMsg);
        this.lastError = errorMsg;
      }
      
      // Keep showing last known state instead of error
      // This prevents flickering between error and success states
    }
  }

  /**
   * Change volume
   */
  public async changeVolume() {
    const input = await vscode.window.showInputBox({
      prompt: 'Enter volume (0-100)',
      value: this.currentVolume.toString(),
      validateInput: (value) => {
        const num = parseInt(value);
        if (isNaN(num) || num < 0 || num > 100) {
          return 'Please enter a number between 0 and 100';
        }
        return null;
      }
    });

    if (input !== undefined) {
      const volume = parseInt(input);
      this.currentVolume = volume;
      try {
        await this.spotifyClient.setVolume(volume);
        this.updateStatusBar();
      } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to set volume: ${error.message}`);
      }
    }
  }

  /**
   * Format time in milliseconds to MM:SS
   */
  private formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Stop periodic updates and dispose
   */
  public dispose() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.trackItem.dispose();
    this.playPauseItem.dispose();
    this.nextItem.dispose();
    this.previousItem.dispose();
    this.shuffleItem.dispose();
    this.repeatItem.dispose();
    this.volumeItem.dispose();
    this.logoutItem.dispose();
  }
}

