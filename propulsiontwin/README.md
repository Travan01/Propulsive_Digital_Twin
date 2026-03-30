# 🛸 PropulsionTwin

**Digital Twin Simulation Environment for Propulsion Systems**

> Real-time physics simulation + Claude AI engineering insights for Jet, Rocket, Electric, and Hybrid propulsion systems.

![PropulsionTwin Screenshot](docs/screenshot-placeholder.png)

---

## ✨ Features

- 🔥 **Jet Engine** — Turbofan/turbojet Brayton cycle thermodynamics (compressor, combustor, turbine, bypass)
- 🚀 **Rocket** — Bipropellant ideal nozzle flow, Isp, ΔV, burn time, mass ratio
- ⚡ **Electric** — Actuator disk theory, motor/ESC/battery efficiency chain, endurance
- 🔀 **Hybrid Composer** — Mix any 2–3 propulsion types with custom power-split ratios
- 📊 **Live Charts** — Thrust history, efficiency curves, power output, performance radar
- 🤖 **AI Insight Engine** — Claude AI analyzes your telemetry and returns engineering insights (nominal/warning/critical)
- 📄 **Export Reports** — Save full simulation reports as `.txt` files
- 💾 **Session Save/Load** — Persist and share your parameter configurations

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- npm v8 or higher

### Install & Run

```bash
# Clone the repository
git clone https://github.com/yourusername/propulsiontwin.git
cd propulsiontwin

# Install dependencies
npm install

# Run in browser (development)
npm run dev

# Run as desktop app (Electron)
npm run electron:dev
```

Open your browser at `http://localhost:5173` for the web version, or use the Electron window that opens automatically.

---

## 📦 Build Executables

Build a platform-specific installer/executable:

```bash
# Windows (.exe installer + portable)
npm run electron:build:win

# macOS (.dmg)
npm run electron:build:mac

# Linux (.AppImage + .deb)
npm run electron:build:linux

# All platforms
npm run electron:build
```

Output files appear in `dist-electron/`.

---

## 🗂️ Project Structure

```
propulsiontwin/
├── electron/
│   ├── main.js          # Electron main process (window, menus, IPC)
│   └── preload.js       # Secure context bridge
├── src/
│   ├── App.jsx          # Main React application
│   ├── main.jsx         # React entry point
│   └── physics/
│       └── engine.js    # Thermodynamic & electromechanical physics models
├── public/
│   └── icon.svg         # App icon
├── docs/
│   └── MANUAL.md        # Full user manual
├── index.html           # HTML entry
├── vite.config.js       # Vite bundler config
└── package.json         # Dependencies & build config
```

---

## 🔬 Physics Models

| System | Model | Key Equations |
|--------|-------|---------------|
| Jet | Brayton cycle (isentropic) | T₂ = T₁·PR^((γ-1)/γ)/η_c |
| Rocket | Ideal rocket equation | Ve = √(2γ/(γ-1)·R·Tc·(1-(Pe/Pc)^((γ-1)/γ))) |
| Electric | Actuator disk + electromechanical | F = (P²·ρ·A/2)^(1/3) |
| Hybrid | Weighted superposition | Result = Σ(wᵢ · resultᵢ) |

---

## 🤖 AI Integration

PropulsionTwin uses the **Anthropic Claude API** to analyze simulation telemetry in real-time. After each parameter change, telemetry is sent to Claude which returns:

- **NOMINAL** — system operating within expected bounds, optimization suggestions
- **WARNING** — approaching physical limits, actionable recommendations  
- **CRITICAL** — exceeding safe operating parameters, intervention required

The app works fully offline — the AI insights panel will show an offline notice if no internet connection is available.

> **Note:** The Claude API is called directly from the app. No API key is required when using this through Claude.ai's artifact system. For standalone deployment, you may need to configure your own API endpoint.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+1` | Switch to Jet mode |
| `Ctrl+2` | Switch to Rocket mode |
| `Ctrl+3` | Switch to Electric mode |
| `Ctrl+4` | Switch to Hybrid mode |
| `Ctrl+E` | Export simulation report |
| `Ctrl+N` | New simulation |
| `F11` | Toggle fullscreen |
| `Ctrl+R` | Reload |
| `ESC` | Close manual |

---

## 📖 Documentation

Full user manual: [`docs/MANUAL.md`](docs/MANUAL.md)

---

## 🛠️ Tech Stack

- **Frontend:** React 18 + Vite
- **Desktop:** Electron 28
- **Charts:** Recharts
- **Physics:** Custom thermodynamic engine (vanilla JS)
- **AI:** Anthropic Claude Sonnet
- **Fonts:** Orbitron, Share Tech Mono, Rajdhani

---

## 📄 License

MIT License — see [LICENSE](LICENSE) file.

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

*Built with ❤️ and thermodynamics*
