# PropulsionTwin — Setup & Execution Guide

## Step-by-Step Instructions for All Platforms

---

## Prerequisites

Install Node.js (v18 or higher) from: https://nodejs.org/

Verify installation:
```
node --version    ← should show v18.x or higher
npm --version     ← should show v8.x or higher
```

---

## OPTION A: Run from Source (Recommended for Development)

### Step 1 — Get the code
```bash
git clone https://github.com/yourusername/propulsiontwin.git
cd propulsiontwin
```

Or unzip the downloaded archive:
```bash
unzip propulsiontwin.zip
cd propulsiontwin
```

### Step 2 — Install dependencies
```bash
npm install
```
This downloads all required packages (~300MB). Takes 1–3 minutes.

### Step 3 — Run the app

**As a web app (browser):**
```bash
npm run dev
```
Then open: http://localhost:5173

**As a desktop app (Electron):**
```bash
npm run electron:dev
```
A native desktop window opens automatically.

---

## OPTION B: Build a Standalone Executable

After completing Step 1 and Step 2 above:

### Windows (.exe installer)
```bash
npm run electron:build:win
```
Find your installer at: `dist-electron/PropulsionTwin Setup 2.0.0.exe`

### macOS (.dmg)
```bash
npm run electron:build:mac
```
Find your disk image at: `dist-electron/PropulsionTwin-2.0.0.dmg`

### Linux (.AppImage)
```bash
npm run electron:build:linux
chmod +x dist-electron/PropulsionTwin-2.0.0.AppImage
./dist-electron/PropulsionTwin-2.0.0.AppImage
```

---

## Sharing on GitHub

### First-time setup
```bash
cd propulsiontwin
git init
git add .
git commit -m "Initial commit: PropulsionTwin v2.0"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/propulsiontwin.git
git push -u origin main
```

### Others can then use it with:
```bash
git clone https://github.com/YOUR_USERNAME/propulsiontwin.git
cd propulsiontwin
npm install
npm run electron:dev
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `node: command not found` | Install Node.js from nodejs.org |
| `npm install` fails | Delete `node_modules/` and retry |
| Port 5173 in use | Kill other processes on that port |
| Electron won't open | Run `npm run dev` first, then open separately |
| White/blank screen | Wait 5 seconds; app is loading |
| AI insights missing | Check internet connection (physics works offline) |

---

For full documentation see: docs/MANUAL.md
