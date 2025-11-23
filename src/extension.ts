import * as vscode from 'vscode';
import { SpotifyAuth } from './spotify/SpotifyAuth';
import { SpotifyClient } from './spotify/SpotifyClient';
import { SpotifyPanelProvider } from './panel/SpotifyPanelProvider';
import { SpotifyStatusBar } from './statusbar/SpotifyStatusBar';

let spotifyAuth: SpotifyAuth;
let spotifyClient: SpotifyClient;
let spotifyPanelProvider: SpotifyPanelProvider;
let spotifyStatusBar: SpotifyStatusBar;

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Spotify Control Panel extension is now active');

  // Initialize Spotify services
  spotifyAuth = new SpotifyAuth(context);
  spotifyClient = new SpotifyClient(spotifyAuth);

  // Register the WebviewView provider
  spotifyPanelProvider = new SpotifyPanelProvider(
    context.extensionUri,
    spotifyClient,
    spotifyAuth
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SpotifyPanelProvider.viewType,
      spotifyPanelProvider
    )
  );

  // Initialize Status Bar
  spotifyStatusBar = new SpotifyStatusBar(spotifyClient, spotifyAuth);
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
        // Check if credentials are configured
        const config = vscode.workspace.getConfiguration('spotify');
        const clientId = config.get<string>('clientId', '');
        const clientSecret = config.get<string>('clientSecret', '');

        if (!clientId || !clientSecret) {
          const result = await vscode.window.showErrorMessage(
            'Spotify credentials not configured. Please set your Client ID and Client Secret in settings.',
            'Open Settings'
          );
          if (result === 'Open Settings') {
            vscode.commands.executeCommand('workbench.action.openSettings', 'spotify');
          }
          return;
        }

        // Show progress
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Authenticating with Spotify...',
            cancellable: false,
          },
          async () => {
            await spotifyAuth.authenticate();
          }
        );

        vscode.window.showInformationMessage('Successfully authenticated with Spotify!');
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
          await spotifyAuth.logout();
          vscode.window.showInformationMessage('Successfully logged out from Spotify');
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
    'Welcome to Spotify Control Panel! To get started, you need to configure your Spotify API credentials.',
    'Setup Guide',
    'Open Settings',
    'Dismiss'
  );

  if (result === 'Setup Guide') {
    vscode.env.openExternal(
      vscode.Uri.parse('https://developer.spotify.com/dashboard/applications')
    );
    vscode.window.showInformationMessage(
      'Create a Spotify app, then add your Client ID and Client Secret in VS Code settings (search for "Spotify").'
    );
  } else if (result === 'Open Settings') {
    vscode.commands.executeCommand('workbench.action.openSettings', 'spotify');
  }

  context.globalState.update('hasShownWelcome', true);
}

/**
 * Extension deactivation
 */
export function deactivate() {
  if (spotifyPanelProvider) {
    spotifyPanelProvider.stopPeriodicUpdates();
  }
  if (spotifyStatusBar) {
    spotifyStatusBar.dispose();
  }
}

