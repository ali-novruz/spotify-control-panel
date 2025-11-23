# Testing Instructions

## What Changed
- ✅ Removed old WebviewView panel (no more sidebar panel)
- ✅ Switched to **Managed Authentication** (uses backend at Digital Ocean)
- ✅ Extension now uses **Status Bar only** for controls
- ✅ Cleared all old authentication tokens

## How to Test

### Step 1: Close Extension Development Host
Close the current Extension Development Host window completely.

### Step 2: Start Fresh Debug Session
1. In the main VS Code window, press `F5`
2. A new Extension Development Host will open

### Step 3: Authenticate
1. Press `Ctrl+Shift+P`
2. Type `Spotify: Authenticate`
3. Browser will open to Spotify login
4. After logging in, you'll see a page with a session token
5. Copy the token and paste it into VS Code input box

### Step 4: Verify Status Bar
Look at the bottom left of VS Code. You should see:
- 🎵 Track name and artist
- ⏯️ Play/Pause button
- ⏮️ Previous button
- ⏭️ Next button
- 🔀 Shuffle button
- 🔁 Repeat button
- 🔊 Volume control

### Step 5: Test Controls
- Click play/pause
- Click next/previous track
- Click volume to change it
- Use keyboard shortcuts:
  - `Ctrl+Alt+Space` - Play/Pause
  - `Ctrl+Alt+Right` - Next Track
  - `Ctrl+Alt+Left` - Previous Track

## Troubleshooting

### If you see "Not authenticated"
1. Press `Ctrl+Shift+P`
2. Run `Spotify: Authenticate`

### If you see old panel in sidebar
1. Close Extension Development Host
2. Press `F5` again

### If authentication fails
1. Check backend is running: https://urchin-app-hs7am.ondigitalocean.app/health
2. Make sure you have Spotify Premium
3. Make sure Spotify app is open and playing

## Backend URL
The extension connects to: `https://urchin-app-hs7am.ondigitalocean.app`

