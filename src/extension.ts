import * as vscode from 'vscode';
import { ManagedAuth } from './spotify/ManagedAuth';
import { SpotifyClient } from './spotify/SpotifyClient';
import { SpotifyStatusBar } from './statusbar/SpotifyStatusBar';

let managedAuth: ManagedAuth;
let spotifyClient: SpotifyClient;
let spotifyStatusBar: SpotifyStatusBar;

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Spotify Control Panel extension is now active');

  // Initialize Spotify services with Managed Auth
  managedAuth = new ManagedAuth(context);
  spotifyClient = new SpotifyClient(managedAuth);

  // Initialize Status Bar
  spotifyStatusBar = new SpotifyStatusBar(spotifyClient, managedAuth);
  context.subscriptions.push(spotifyStatusBar);

  // Register commands
  registerCommands(context);

  // Show welcome message on first activation
  const hasShownWelcome = context.globalState.get<boolean>('hasShownWelcome', false);
  if (!hasShownWelcome) {
    showWelcomeMessage(context);
  }
}

/**
 * Register all extension commands
 */
function registerCommands(context: vscode.ExtensionContext) {
  // Authenticate command
  context.subscriptions.push(
    vscode.commands.registerCommand('spotify.authenticate', async () => {
      try {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Authenticating with Spotify...',
            cancellable: false,
          },
          async () => {
            await managedAuth.authenticate();
          }
        );
        // Refresh status bar after successful authentication
        if (spotifyStatusBar) {
          spotifyStatusBar.forceRefresh();
        }
      } catch (error: any) {
        vscode.window.showErrorMessage(`Authentication failed: ${error.message}`);
      }
    })
  );

  // Play/Pause command
  context.subscriptions.push(
    vscode.commands.registerCommand('spotify.playPause', async () => {
      try {
        await spotifyClient.togglePlayPause();
        vscode.window.showInformationMessage('Spotify: Play/Pause toggled');
      } catch (error: any) {
        vscode.window.showErrorMessage(`Spotify: ${error.message}`);
      }
    })
  );

  // Next track command
  context.subscriptions.push(
    vscode.commands.registerCommand('spotify.nextTrack', async () => {
      try {
        await spotifyClient.nextTrack();
        vscode.window.showInformationMessage('Spotify: Skipped to next track');
      } catch (error: any) {
        vscode.window.showErrorMessage(`Spotify: ${error.message}`);
      }
    })
  );

  // Previous track command
  context.subscriptions.push(
    vscode.commands.registerCommand('spotify.previousTrack', async () => {
      try {
        await spotifyClient.previousTrack();
        vscode.window.showInformationMessage('Spotify: Skipped to previous track');
      } catch (error: any) {
        vscode.window.showErrorMessage(`Spotify: ${error.message}`);
      }
    })
  );

  // Toggle shuffle command
  context.subscriptions.push(
    vscode.commands.registerCommand('spotify.toggleShuffle', async () => {
      try {
        await spotifyClient.toggleShuffle();
        vscode.window.showInformationMessage('Spotify: Shuffle toggled');
      } catch (error: any) {
        vscode.window.showErrorMessage(`Spotify: ${error.message}`);
      }
    })
  );

  // Toggle repeat command
  context.subscriptions.push(
    vscode.commands.registerCommand('spotify.toggleRepeat', async () => {
      try {
        await spotifyClient.toggleRepeat();
        vscode.window.showInformationMessage('Spotify: Repeat toggled');
      } catch (error: any) {
        vscode.window.showErrorMessage(`Spotify: ${error.message}`);
      }
    })
  );

  // Logout command
  context.subscriptions.push(
    vscode.commands.registerCommand('spotify.logout', async () => {
      try {
        const result = await vscode.window.showWarningMessage(
          'Are you sure you want to logout from Spotify?',
          'Yes',
          'No'
        );
        if (result === 'Yes') {
          await managedAuth.logout();
          vscode.window.showInformationMessage('Successfully logged out from Spotify');
          // Refresh status bar after logout
          if (spotifyStatusBar) {
            spotifyStatusBar.forceRefresh();
          }
        }
      } catch (error: any) {
        vscode.window.showErrorMessage(`Logout failed: ${error.message}`);
      }
    })
  );

  // Change volume command
  context.subscriptions.push(
    vscode.commands.registerCommand('spotify.changeVolume', async () => {
      if (spotifyStatusBar) {
        await spotifyStatusBar.changeVolume();
      }
    })
  );
}

/**
 * Show welcome message with setup instructions
 */
async function showWelcomeMessage(context: vscode.ExtensionContext) {
  const result = await vscode.window.showInformationMessage(
    'Welcome to Spotify Control Panel! Click Authenticate to connect your Spotify account.',
    'Authenticate',
    'Dismiss'
  );

  if (result === 'Authenticate') {
    vscode.commands.executeCommand('spotify.authenticate');
  }

  context.globalState.update('hasShownWelcome', true);
}

/**
 * Extension deactivation
 */
export function deactivate() {
  if (spotifyStatusBar) {
    spotifyStatusBar.dispose();
  }
}

