# 🎵 Spotify Control Panel for VS Code

Control your Spotify playback directly from Visual Studio Code without leaving your editor. A lightweight, feature-rich extension that brings Spotify controls right into your status bar.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

- **🎮 Full Playback Control** - Play, pause, skip tracks, and control volume
- **📊 Status Bar Integration** - All controls accessible from the bottom status bar
- **⌨️ Keyboard Shortcuts** - Quick control with customizable keybindings
- **🎨 Real-time Updates** - Live track information and progress
- **🔀 Shuffle & Repeat** - Toggle shuffle and repeat modes
- **🔊 Volume Control** - Adjust volume directly from VS Code
- **🔐 Secure Authentication** - OAuth 2.0 with encrypted token storage
- **🎯 Minimal UI** - Doesn't interrupt your coding flow

## 📸 Screenshots

### Status Bar Controls
```
🎵 Song Name - Artist | 1:23/3:45 | ⏸️ ⏮️ ⏭️ 🔀 🔁 🔊 75%
```

All controls are clickable and update in real-time!

## 🚀 Quick Start

### Prerequisites

- **Spotify Premium Account** (required for playback control API)
- **VS Code** 1.75.0 or higher
- **Active Spotify Device** (desktop, mobile, or web player)

### Installation

1. **Install from VS Code Marketplace**
   - Open VS Code
   - Go to Extensions (`Ctrl+Shift+X`)
   - Search for "Spotify Control Panel"
   - Click Install

2. **Authenticate (Easy - No Setup Required!)**
   - Press `Ctrl+Shift+P`
   - Run: `Spotify: Authenticate`
   - Browser will open - login with your Spotify account
   - Click "Agree"
   - Copy the token shown (auto-copied to clipboard)
   - Paste it in VS Code when prompted
   - Done! 🎉

### Alternative: Self-Hosted Mode (Advanced Users)

If you prefer to use your own Spotify Developer App:

1. **Create Spotify Developer App**
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create an app and get Client ID/Secret
   - Add Redirect URI: `http://127.0.0.1:8888/callback`

2. **Configure Extension**
   - Open VS Code Settings (`Ctrl+,`)
   - Search for "Spotify"
   - Change **Auth Mode** to "self-hosted"
   - Enter your Client ID and Client Secret

3. **Authenticate**
   - Press `Ctrl+Shift+P`
   - Run: `Spotify: Authenticate`

## 🎮 Usage

### Status Bar Controls

Once authenticated and playing music on Spotify, you'll see controls in the status bar:

- **🎵 Track Info** - Shows current song and artist
- **⏸️/▶️** - Play/Pause toggle
- **⏮️** - Previous track
- **⏭️** - Next track
- **🔀** - Toggle shuffle (green when active)
- **🔁** - Toggle repeat (green when active)
- **🔊** - Volume control (click to change)

### Keyboard Shortcuts

| Action | Windows/Linux | Mac |
|--------|---------------|-----|
| Play/Pause | `Ctrl+Alt+Space` | `Cmd+Alt+Space` |
| Next Track | `Ctrl+Alt+Right` | `Cmd+Alt+Right` |
| Previous Track | `Ctrl+Alt+Left` | `Cmd+Alt+Left` |

### Commands

Access via Command Palette (`Ctrl+Shift+P`):

- `Spotify: Authenticate` - Login to Spotify
- `Spotify: Play/Pause` - Toggle playback
- `Spotify: Next Track` - Skip to next track
- `Spotify: Previous Track` - Skip to previous track
- `Spotify: Toggle Shuffle` - Toggle shuffle mode
- `Spotify: Toggle Repeat` - Cycle repeat modes
- `Spotify: Change Volume` - Adjust volume (0-100)
- `Spotify: Logout` - Clear authentication

## ⚙️ Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| `spotify.clientId` | Your Spotify Client ID | `""` |
| `spotify.clientSecret` | Your Spotify Client Secret | `""` |
| `spotify.redirectUri` | OAuth redirect URI | `http://127.0.0.1:8888/callback` |
| `spotify.refreshInterval` | Update interval in milliseconds | `1000` |

## 🔧 Troubleshooting

### "No active device found"
**Solution**: Make sure Spotify is running and playing on at least one device (desktop, mobile, or web player).

### "Authentication failed"
**Solutions**:
- Verify your Client ID and Client Secret are correct
- Make sure Redirect URI in Spotify Dashboard matches: `http://127.0.0.1:8888/callback`
- Try using `http://127.0.0.1:8888/callback` instead of `localhost`

### "Premium required"
**Solution**: Spotify's playback control API requires a Premium account. Free accounts cannot use these features.

### Extension not updating
**Solutions**:
- Check your refresh interval in settings (default is 1000ms)
- Make sure you're authenticated
- Try reloading the VS Code window

### Volume control not working
**Solution**: Some Spotify Connect devices don't support volume control via API. Try controlling volume on the device directly.

## 🛠️ Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/yourusername/spotify-control-panel.git
cd spotify-control-panel

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Run in development mode
# Press F5 in VS Code
```

### Project Structure

```
spotify-control-panel/
├── src/
│   ├── extension.ts              # Main entry point
│   ├── spotify/
│   │   ├── SpotifyAuth.ts        # OAuth 2.0 authentication
│   │   ├── SpotifyClient.ts      # Spotify API wrapper
│   │   └── types.ts              # TypeScript interfaces
│   ├── panel/
│   │   └── SpotifyPanelProvider.ts  # Sidebar panel (optional)
│   └── statusbar/
│       └── SpotifyStatusBar.ts   # Status bar controller
├── package.json                   # Extension manifest
└── tsconfig.json                  # TypeScript config
```

## 📝 Requirements

- **Spotify Premium**: Required for playback control API
- **Active Device**: Spotify must be playing on a device
- **Internet Connection**: Required for API communication

## 🔐 Privacy & Security

- **Credentials**: Client ID and Secret stored in VS Code settings
- **Tokens**: Access and refresh tokens encrypted via VS Code SecretStorage
- **Permissions**: Only requests playback control permissions
- **No Data Collection**: This extension does not collect or transmit any personal data

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [VS Code Extension API](https://code.visualstudio.com/api)
- Powered by [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
- Icons from [VS Code Codicons](https://microsoft.github.io/vscode-codicons/dist/codicon.html)

## 📧 Support

If you encounter any issues or have questions:
- Open an issue on [GitHub](https://github.com/yourusername/spotify-control-panel/issues)
- Check the [Troubleshooting](#-troubleshooting) section

## ⭐ Show Your Support

If you like this extension, please:
- ⭐ Star the repository on GitHub
- 📝 Leave a review on VS Code Marketplace
- 🐛 Report bugs or suggest features

---

**Made with ❤️ for developers who code with music**

**Enjoy coding with your favorite tunes! 🎵**
