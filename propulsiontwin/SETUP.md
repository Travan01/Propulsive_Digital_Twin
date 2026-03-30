# PropulsionTwin — Setup & Execution Guide

## Tested Environment
- Node.js : v20.20.2
- npm     : 10.8.2
- OS      : Windows 10/11 · macOS 12+ · Ubuntu 20.04+

---

## Step 1 — Install Node.js v20

Download from https://nodejs.org/ → choose **v20 LTS**.

Verify:
```
node --version   # must show v20.x.x
npm --version    # must show 10.x.x
```

> If you use nvm: `nvm install 20.20.2 && nvm use 20.20.2`
> A `.nvmrc` file is included — just run `nvm use` inside the project folder.

---

## Step 2 — Get the code

**From GitHub:**
```bash
git clone https://github.com/yourusername/propulsiontwin.git
cd propulsiontwin
```

**From zip:**
```bash
unzip propulsiontwin.zip
cd propulsiontwin
```

---

## Step 3 — Install dependencies

```bash
npm install
```

This installs all packages listed in `package.json` (React, Electron, Vite, Recharts, etc.).
Takes 1–3 minutes depending on internet speed.

---

## Step 4 — Run the app

### Web browser only (fastest, no Electron needed):
```bash
npm run dev
```
Open **http://localhost:5173** in your browser.

### Full desktop app (Electron window):
```bash
npm run electron:dev
```
A native desktop window opens automatically. Both the Vite dev server and Electron launch together.

---

## Step 5 (Optional) — Build a standalone executable

```bash
# Windows — produces .exe installer in dist-electron/
npm run electron:build:win

# macOS — produces .dmg in dist-electron/
npm run electron:build:mac

# Linux — produces .AppImage in dist-electron/
npm run electron:build:linux
```

---

## Publishing to GitHub (so others can clone and run it)

```bash
cd propulsiontwin
git init
git add .
git commit -m "feat: PropulsionTwin v2.0 initial release"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/propulsiontwin.git
git push -u origin main
```

Anyone can then run:
```bash
git clone https://github.com/YOUR_USERNAME/propulsiontwin.git
cd propulsiontwin
npm install
npm run electron:dev
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `node: command not found` | Install Node.js v20 from nodejs.org |
| `npm install` peer dependency errors | Run `npm install --legacy-peer-deps` |
| `Error: EADDRINUSE 5173` | Another Vite instance is running — kill it first |
| Electron window is blank/white | Wait 5s; Vite is still compiling. Reload with Ctrl+R |
| AI insights not showing | Check internet connection. Physics sim works fully offline |
| `electron-builder` fails on Windows | Run terminal as Administrator |
| `electron-builder` fails on Linux | Install: `sudo apt install fakeroot` |
| macOS: "app is damaged" warning | Run: `xattr -cr /Applications/PropulsionTwin.app` |

---

## File structure (what each file does)

```
propulsiontwin/
├── electron/
│   ├── main.js        ← Electron main process: window creation, native menus,
│   │                     file save/load dialogs, IPC handlers
│   └── preload.js     ← Secure bridge: exposes safe Electron APIs to React
├── src/
│   ├── App.jsx        ← Entire React UI: all 4 simulation modes, charts,
│   │                     AI insight panel, hybrid composer, export logic
│   ├── main.jsx       ← React entry point (mounts App into #root)
│   └── physics/
│       └── engine.js  ← Pure physics: Brayton cycle (jet), ideal nozzle
│                         (rocket), actuator disk (electric), hybrid blending
├── public/
│   └── icon.svg       ← App icon (used by Electron + browser tab)
├── docs/
│   └── MANUAL.md      ← Full 13-section user manual
├── index.html         ← HTML entry point with CSP headers
├── vite.config.js     ← Vite bundler config (React plugin, base ./, port 5173)
├── package.json       ← Dependencies, scripts, electron-builder config
├── .nvmrc             ← Pins Node version for nvm users (20.20.2)
├── .npmrc             ← npm behavior flags (save-exact, no fund/audit)
├── .gitignore         ← Excludes node_modules, dist, dist-electron
├── README.md          ← GitHub readme with full feature list
├── SETUP.md           ← This file
└── LICENSE            ← MIT license
```
