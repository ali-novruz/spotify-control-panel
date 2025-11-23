# 📦 Publishing Guide

Complete guide to publish this extension to VS Code Marketplace.

---

## 📋 Pre-Publishing Checklist

### ✅ Required Files
- [x] `README.md` - Comprehensive documentation
- [x] `LICENSE` - MIT License
- [x] `CHANGELOG.md` - Version history
- [x] `package.json` - Complete with all metadata
- [ ] `icon.png` - 128x128 PNG icon (see ICON_INFO.md)

### ✅ Code Quality
- [x] TypeScript compiled without errors
- [x] No linter errors
- [x] All features tested
- [x] Extension works in development mode

### ✅ Documentation
- [x] Installation instructions
- [x] Usage examples
- [x] Troubleshooting section
- [x] Configuration options documented

---

## 🚀 Step 1: Prepare for Publishing

### 1.1 Create Icon (if not done)

Create a 128x128 PNG icon and save as `icon.png` in the root directory.

### 1.2 Update package.json

Make sure these fields are correct:
```json
{
  "publisher": "your-publisher-name",
  "repository": {
    "url": "https://github.com/YOUR_USERNAME/spotify-control-panel.git"
  }
}
```

### 1.3 Compile the Extension

```bash
npm run compile
```

---

## 📤 Step 2: Publish to GitHub

### 2.1 Initialize Git Repository

```bash
cd C:\Users\nevin\OneDrive\Desktop\spotextentions
git init
git add .
git commit -m "Initial commit: Spotify Control Panel v1.0.0"
```

### 2.2 Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `spotify-control-panel`
3. Description: `Control Spotify playback directly from VS Code`
4. Public repository
5. **Don't** initialize with README (we already have one)
6. Click "Create repository"

### 2.3 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/spotify-control-panel.git
git branch -M main
git push -u origin main
```

---

## 🏪 Step 3: Publish to VS Code Marketplace

### 3.1 Create Azure DevOps Account

1. Go to https://dev.azure.com/
2. Sign in with Microsoft account
3. Create a new organization (e.g., "your-name-extensions")

### 3.2 Create Personal Access Token

1. Click on user icon (top right)
2. Select "Personal access tokens"
3. Click "New Token"
4. Settings:
   - **Name**: `vscode-marketplace`
   - **Organization**: All accessible organizations
   - **Expiration**: 90 days (or custom)
   - **Scopes**: Click "Show all scopes"
     - Find "Marketplace"
     - Check ✅ **Manage**
5. Click "Create"
6. **COPY THE TOKEN** (you won't see it again!)

### 3.3 Create Publisher

1. Go to https://marketplace.visualstudio.com/manage
2. Click "Create publisher"
3. Fill in:
   - **ID**: `your-publisher-id` (lowercase, no spaces)
   - **Display Name**: Your name or company
   - **Email**: Your email
4. Click "Create"

### 3.4 Install VSCE (VS Code Extension Manager)

```bash
npm install -g @vscode/vsce
```

### 3.5 Login with VSCE

```bash
vsce login YOUR_PUBLISHER_ID
```

When prompted, paste your Personal Access Token.

### 3.6 Package the Extension

```bash
vsce package
```

This creates `spotify-control-panel-1.0.0.vsix`

### 3.7 Test the Package Locally

```bash
code --install-extension spotify-control-panel-1.0.0.vsix
```

Test thoroughly!

### 3.8 Publish to Marketplace

```bash
vsce publish
```

**That's it!** 🎉

Your extension will be live in ~5-10 minutes at:
```
https://marketplace.visualstudio.com/items?itemName=YOUR_PUBLISHER_ID.spotify-control-panel
```

---

## 🔄 Step 4: Update & Republish

### Update Version

Edit `package.json`:
```json
{
  "version": "1.0.1"
}
```

Update `CHANGELOG.md` with changes.

### Publish Update

```bash
# Compile
npm run compile

# Option 1: Auto-increment version
vsce publish patch   # 1.0.0 → 1.0.1
vsce publish minor   # 1.0.0 → 1.1.0
vsce publish major   # 1.0.0 → 2.0.0

# Option 2: Manual publish
vsce publish
```

---

## 📊 Step 5: Monitor & Promote

### Monitor Stats

Check your extension stats at:
https://marketplace.visualstudio.com/manage/publishers/YOUR_PUBLISHER_ID

### Promote Your Extension

1. **GitHub**
   - Add badges to README
   - Create releases
   - Add topics/tags

2. **Social Media**
   - Share on Twitter
   - Post on Reddit (r/vscode)
   - Share on Dev.to

3. **Documentation**
   - Create GIFs/videos
   - Write blog post
   - Add to personal portfolio

---

## 🐛 Troubleshooting

### "Publisher not found"
**Solution**: Make sure you created a publisher and used the correct ID in `vsce login`.

### "Extension validation failed"
**Solution**: Check that all required fields in `package.json` are filled.

### "Icon not found"
**Solution**: Create `icon.png` (128x128) in the root directory.

### "Repository URL invalid"
**Solution**: Update the repository URL in `package.json` to your actual GitHub repo.

---

## 📝 Quick Command Reference

```bash
# Install VSCE
npm install -g @vscode/vsce

# Login
vsce login YOUR_PUBLISHER_ID

# Package
vsce package

# Publish
vsce publish

# Publish with version bump
vsce publish patch
vsce publish minor
vsce publish major

# Unpublish (use carefully!)
vsce unpublish YOUR_PUBLISHER_ID.spotify-control-panel
```

---

## ✅ Post-Publishing Checklist

- [ ] Extension appears on Marketplace
- [ ] Install and test from Marketplace
- [ ] README displays correctly
- [ ] Icon shows properly
- [ ] All links work
- [ ] Create GitHub release
- [ ] Add badges to README
- [ ] Share on social media

---

## 🎉 Congratulations!

Your extension is now live on VS Code Marketplace!

**Next Steps:**
1. Monitor user feedback
2. Fix bugs quickly
3. Add requested features
4. Keep documentation updated
5. Engage with community

---

**Good luck with your extension! 🚀**

