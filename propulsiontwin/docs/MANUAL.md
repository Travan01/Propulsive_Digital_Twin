# PropulsionTwin — User Manual
## Version 2.0 | Digital Twin Simulation Environment

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Installation](#2-installation)
3. [Interface Overview](#3-interface-overview)
4. [Propulsion Modes](#4-propulsion-modes)
5. [Parameter Reference](#5-parameter-reference)
6. [Hybrid Composer](#6-hybrid-composer)
7. [Charts & Telemetry](#7-charts--telemetry)
8. [AI Insight Engine](#8-ai-insight-engine)
9. [Exporting Reports](#9-exporting-reports)
10. [Session Management](#10-session-management)
11. [Keyboard Shortcuts](#11-keyboard-shortcuts)
12. [Physics Models](#12-physics-models)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Introduction

**PropulsionTwin** is a desktop-class digital twin simulation environment for engineering analysis and exploration of propulsion systems. It combines real thermodynamic and electromechanical physics models with Claude AI engineering insights to give you both quantitative simulation results and qualitative engineering guidance in real time.

### What is a Digital Twin?

A digital twin is a virtual replica of a physical system that mirrors its behavior under varying conditions. PropulsionTwin lets you configure propulsion parameters, observe performance characteristics, and explore design trade-offs without building physical hardware.

### Supported Systems

| Mode | Type | Application |
|------|------|-------------|
| **Jet** | Turbofan / Turbojet | Aircraft, UAVs, missiles |
| **Rocket** | Bipropellant liquid | Launch vehicles, spacecraft |
| **Electric** | Motor + battery | eVTOL, drones, electric aircraft |
| **Hybrid** | Multi-mode blend | Next-gen combined propulsion |

---

## 2. Installation

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| OS | Windows 10, macOS 11, Ubuntu 20.04 | Windows 11, macOS 13, Ubuntu 22.04 |
| RAM | 4 GB | 8 GB |
| Storage | 500 MB | 1 GB |
| Display | 1280×720 | 1920×1080 or higher |
| Node.js | v18.0 | v20.x LTS |
| Internet | Optional (for AI) | Recommended |

### Method 1: From GitHub (Development Mode)

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/propulsiontwin.git
cd propulsiontwin

# 2. Install all dependencies
npm install

# 3a. Run in browser only
npm run dev
# Then open: http://localhost:5173

# 3b. Run as Electron desktop app
npm run electron:dev
```

### Method 2: Build a Standalone Executable

```bash
# After cloning and npm install:

# Windows
npm run electron:build:win
# Output: dist-electron/PropulsionTwin Setup X.X.X.exe

# macOS
npm run electron:build:mac
# Output: dist-electron/PropulsionTwin-X.X.X.dmg

# Linux
npm run electron:build:linux
# Output: dist-electron/PropulsionTwin-X.X.X.AppImage
```

### Method 3: Download Release

Visit the GitHub Releases page and download the pre-built installer for your platform. No Node.js required.

---

## 3. Interface Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  🛸 PROPULSIONTWIN          SESSION 00:04:32  MODE: JET  MANUAL │  ← Header
├──────────────┬──────────────────────────────────┬───────────────┤
│              │  KPI ROW (Thrust/Power/Isp/Eff)  │               │
│   SIDEBAR    ├──────────────────────────────────┤  AI INSIGHT   │
│              │  SECONDARY KPI ROW               │  ENGINE       │
│  ┌ Type ─┐   ├──────────┬───────────────────────┤               │
│  │Selector│  │Thrust    │ Efficiency·Ve          │  ┌─────────┐ │
│  └───────┘   │History   │ Chart                  │  │NOMINAL  │ │
│              ├──────────┼───────────────────────┤  │insight  │ │
│  ┌ Hybrid ┐  │Power     │ Radar Envelope         │  ├─────────┤ │
│  │Composer│  │History   │                        │  │WARNING  │ │
│  └────────┘  ├──────────┴───────────────────────┤  │insight  │ │
│              │  TELEMETRY STRIP                  │  ├─────────┤ │
│  ┌ Params ┐  ├──────────────────────────────────┤  │ALL      │ │
│  │Sliders │  │  T+0045 · timestamp               │  │METRICS  │ │
│  └────────┘  │                                  │  ├─────────┤ │
│              │                                  │  │EXPORT   │ │
└──────────────┴──────────────────────────────────┴───────────────┘
```

### Panels

- **Left Sidebar** — Propulsion type selector, Hybrid Composer, parameter sliders, session controls
- **Center** — KPI cards, 4 live charts, telemetry strip, timestamp
- **Right Panel** — AI insight engine, all metrics table, export button

---

## 4. Propulsion Modes

### ✈ Jet (Turbofan / Turbojet)

Simulates the Brayton thermodynamic cycle with:
- Isentropic compression (with efficiency loss)
- Constant-pressure combustion
- Turbine expansion
- Bypass stream (BPR > 0 = turbofan)

**Key outputs:** Thrust, compressor exit temp, turbine exit temp, bypass thrust, TSFC, Isp

**Real-world analogues:** CFM56, GE90, Rolls-Royce Trent, Pratt & Whitney F135

### 🚀 Rocket (Bipropellant)

Simulates ideal rocket nozzle flow using:
- De Laval nozzle thermodynamics
- Tsiolkovsky rocket equation for ΔV
- Expansion ratio from chamber/exit pressure ratio

**Key outputs:** Thrust, Isp, exit velocity, ΔV, burn time, mass ratio

**Real-world analogues:** SpaceX Merlin, Raptor, RS-25, Aerojet RL10

### ⚡ Electric (Motor + Battery)

Simulates the complete electric drivetrain:
- Battery → Controller → Motor → Propeller
- Actuator disk theory for static thrust
- Efficiency chain (battery × ESC × motor)

**Key outputs:** Thrust, shaft power, torque, endurance, heat dissipation, input power

**Real-world analogues:** Joby Aviation, Lilium, Archer Aviation eVTOL motors

### 🔀 Hybrid (Multi-Mode)

Blends any 2–3 propulsion types. Each component's outputs are weighted by its power-share percentage. The result represents a superposition of the systems operating simultaneously.

**Use cases:** Turbofan + electric (hybrid-electric aircraft), rocket + electric (ascent + orbital), jet + rocket (SABRE-style engines)

---

## 5. Parameter Reference

### Jet Parameters

| Parameter | Unit | Range | Description |
|-----------|------|-------|-------------|
| Inlet Temperature | °C | -60 to 60 | Ambient air temperature at engine intake |
| Overall Pressure Ratio | :1 | 5 to 65 | Total compressor pressure ratio |
| Core Mass Flow | kg/s | 10 to 600 | Air mass flow through core |
| Turbine Inlet Temp | °C | 800 to 1800 | Temperature before turbine (TIT / TET) |
| Compressor Efficiency | % | 60 to 99 | Isentropic compressor efficiency |
| Turbine Efficiency | % | 60 to 99 | Isentropic turbine efficiency |
| Bypass Ratio | BPR | 0 to 15 | Fan air / core air ratio (0 = turbojet) |

**Tips:**
- TIT above 1600°C requires advanced cooling technology
- OPR above 45 typically requires multi-stage compression
- BPR 5–12 is typical for modern high-bypass turbofans (airliners)

### Rocket Parameters

| Parameter | Unit | Range | Description |
|-----------|------|-------|-------------|
| Chamber Temperature | °C | 1000 to 4500 | Combustion chamber temperature |
| Chamber Pressure | bar | 10 to 500 | Chamber stagnation pressure |
| Nozzle Exit Pressure | bar | 0.001 to 5 | Nozzle exit static pressure |
| Propellant Mass Flow | kg/s | 10 to 2000 | Total propellant consumption rate |
| Exhaust Mol. Weight | g/mol | 2 to 44 | Mean molecular weight of exhaust gases |
| Specific Heat Ratio γ | — | 1.1 to 1.5 | Ratio of specific heats (Cp/Cv) |
| Propellant Mass | kg | 100 to 500,000 | Total usable propellant mass |
| Dry Mass | kg | 50 to 100,000 | Vehicle mass without propellant |

**Tips:**
- H₂/LOX: Mw ≈ 10, γ ≈ 1.26, Tc ≈ 3300°C → very high Isp (~450s)
- RP-1/LOX: Mw ≈ 22, γ ≈ 1.2, Tc ≈ 3300°C → Isp ~310s
- N₂O₄/UDMH: Mw ≈ 25, γ ≈ 1.22 → storable, Isp ~310s
- Exit pressure = ambient for optimally expanded nozzle

### Electric Parameters

| Parameter | Unit | Range | Description |
|-----------|------|-------|-------------|
| Bus Voltage | V | 24 to 1000 | Battery pack voltage |
| Current Draw | A | 1 to 2000 | Operating current |
| Motor Speed | RPM | 500 to 50,000 | Motor rotational speed |
| Motor Efficiency | % | 60 to 99 | Electromechanical conversion efficiency |
| Battery Efficiency | % | 70 to 99 | Electrochemical round-trip efficiency |
| ESC Efficiency | % | 80 to 99 | Electronic speed controller efficiency |
| Battery Capacity | mAh | 1,000 to 500,000 | Total battery energy capacity |
| Propeller Pitch | in | 2 to 30 | Distance propeller advances per revolution |
| Propeller Diameter | in | 4 to 60 | Propeller disc diameter |

**Tips:**
- Total input power = Voltage × Current (in Watts)
- Larger diameter propellers are more efficient at low speeds
- High RPM + small prop = high speed, low thrust per watt

---

## 6. Hybrid Composer

The Hybrid Composer allows you to construct a multi-mode propulsion system by combining 2 or 3 base propulsion types.

### How to Use

1. Select **Hybrid** mode from the type selector
2. The composer shows 2 default components (Jet + Electric at 60%/40%)
3. Use the **dropdown** on each row to change the component type
4. Use the **slider** to adjust each component's power share weight
5. Click **+ ADD COMPONENT** to add a third element (up to 3 total)
6. Click **×** to remove a component (minimum 2 required)

### Weight Normalization

Weights are automatically normalized to sum to 100%. For example:
- Jet: 60, Electric: 40 → Jet: 60%, Electric: 40%
- Jet: 60, Electric: 40, Rocket: 20 → Jet: 50%, Electric: 33.3%, Rocket: 16.7%

### Output Interpretation

Hybrid outputs represent the weighted superposition of all component systems. This approximates a system where components share propulsive load proportionally.

---

## 7. Charts & Telemetry

### Thrust History (Area Chart)
Traces thrust output over the last 80 parameter changes. The colored area fills correspond to the active propulsion mode color.

### Efficiency · Exit Velocity (Dual-Axis Line Chart)
- **Green line** (left axis): Thermal/electrical efficiency %
- **Amber line** (right axis): Exhaust exit velocity m/s

### Power Output History (Area Chart)
Shaft power delivered over history. Useful for tracking power trends during optimization.

### Performance Envelope (Radar Chart)
Five-axis normalized performance map:
- **THRUST** — normalized to 500 kN reference
- **EFFIC** — efficiency %
- **ISP** — specific impulse normalized to 500s
- **POWER** — normalized to 1000 kW reference
- **Ve** — exit velocity normalized to 5000 m/s

### Telemetry Strip
The bottom strip shows raw values for all primary metrics, updated every parameter change.

---

## 8. AI Insight Engine

The AI Insight Engine connects to **Anthropic's Claude** to analyze your simulation telemetry after each parameter adjustment.

### Insight Severity Levels

| Level | Color | Meaning |
|-------|-------|---------|
| NOMINAL | Cyan | System operating well. Optimization suggestions. |
| WARNING | Amber | Approaching physical limits. Actionable recommendation. |
| CRITICAL | Red | Exceeding safe parameters. Intervention needed. |

### Offline Behavior

If no internet connection is available, the panel shows an offline notice. All physics simulation remains fully functional without internet.

### Update Frequency

Insights update 1.8 seconds after the last parameter change. This debounce prevents excessive API calls during rapid slider adjustment.

---

## 9. Exporting Reports

### From the UI
Click **⬇ EXPORT SIMULATION REPORT** in the right panel.

### From the Menu
**File → Export Report** or `Ctrl+E`

### Report Contents

```
╔══════════════════════════════════════════════════════════╗
║         PROPULSIONTWIN — SIMULATION REPORT v2.0         ║
╚══════════════════════════════════════════════════════════╝

  Generated : 2025-07-14T09:31:00.000Z
  Mode      : JET
  Session   : T+4m 32s

──────────────────────────────────────────────────────────
  PERFORMANCE METRICS
──────────────────────────────────────────────────────────
  thrust                   241.823400
  power                    18291.234000
  efficiency               38.721000
  ...

──────────────────────────────────────────────────────────
  PARAMETERS
──────────────────────────────────────────────────────────
  inletTemp                15
  pressureRatio            30
  ...

──────────────────────────────────────────────────────────
  AI ENGINEERING INSIGHTS
──────────────────────────────────────────────────────────
  1. [NOMINAL] Thermal efficiency within design envelope
     At 38.7% thermal efficiency with OPR 30...
  ...
```

---

## 10. Session Management

### Reset Parameters
Click **RESET PARAMS** in the sidebar to restore all sliders to default values.

### Clear History
Click **CLEAR HISTORY** to reset all chart trace data.

### Save/Load Sessions (Desktop Only)
- **File → Save Session** — saves current parameters as a `.json` file
- **File → Load Session** — restores parameters from a saved `.json` file

Session files can be shared with colleagues to reproduce exact simulation states.

---

## 11. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+1` | Switch to Jet mode |
| `Ctrl+2` | Switch to Rocket mode |
| `Ctrl+3` | Switch to Electric mode |
| `Ctrl+4` | Switch to Hybrid mode |
| `Ctrl+E` | Export simulation report |
| `Ctrl+N` | New simulation (reset all) |
| `Ctrl+S` | Save session |
| `F11` | Toggle fullscreen |
| `Ctrl+R` | Reload application |
| `Ctrl+=` | Zoom in |
| `Ctrl+-` | Zoom out |
| `Ctrl+0` | Reset zoom |
| `ESC` | Close manual / modal |

---

## 12. Physics Models

### Jet Engine (Brayton Cycle)

```
Compressor exit temperature:
  T₂ = T₁ + (T₁ · PR^((γ-1)/γ) - T₁) / η_c

Compressor work:
  W_c = ṁ · Cₚ · (T₂ - T₁)

Turbine exit temperature:
  T₄ = T₃ - W_c / (ṁ · Cₚ · η_t)

Exit velocity:
  Vₑ = √(2 · η_t · Cₚ · (T₃ - T₄))

Thrust:
  F = (ṁ_core · Vₑ + ṁ_bypass · Vₑ_bypass) / 1000  [kN]
```

Where: T₁ = inlet temp [K], PR = pressure ratio, γ = 1.4, Cₚ = 1005 J/(kg·K)

### Rocket Engine (Ideal Nozzle)

```
Exhaust velocity (ideal):
  Vₑ = √(2γ/(γ-1) · R·Tc · (1 - (Pₑ/Pc)^((γ-1)/γ)))

Specific impulse:
  Isp = Vₑ / g₀

Thrust:
  F = ṁ · Vₑ / 1000  [kN]

Delta-V (Tsiolkovsky):
  ΔV = Vₑ · ln((m_dry + m_prop) / m_dry)

Burn time:
  t_b = m_prop / ṁ
```

Where: R = Rᵤ/Mw [J/(kg·K)], g₀ = 9.80665 m/s²

### Electric Propulsion (Actuator Disk)

```
Total input power:
  P_in = V · I

Shaft power:
  P_shaft = P_in · η_motor · η_battery · η_ESC

Static thrust (actuator disk):
  F = (P_shaft² · ρ · A / 2)^(1/3) / 1000  [kN]

Endurance:
  t = (C_batt × V / 1000) / P_shaft [hours] × 60 [minutes]
```

Where: ρ = 1.225 kg/m³, A = π·(D/2)²

---

## 13. Troubleshooting

### App won't start
- Ensure Node.js v18+ is installed: `node --version`
- Delete `node_modules/` and run `npm install` again
- On Linux: `chmod +x` the AppImage before running

### AI insights not loading
- Check internet connection
- The Anthropic API endpoint must be reachable
- Physics simulation works fully without AI — this is non-blocking

### Charts appear empty
- Adjust any slider to trigger a simulation update
- Click "CLEAR HISTORY" then adjust a parameter

### Electron window won't open
- Ensure port 5173 is free (kill other Vite instances)
- Run `npm run dev` first, then `npm run electron:dev` separately if needed

### Build fails
- Ensure `electron-builder` dependencies are installed: `npm install`
- On macOS, code signing may be required for distribution builds
- On Windows, run as Administrator if permission errors occur

### Physics values look wrong
- Check parameter units carefully (°C vs K, bar vs Pa)
- Very extreme parameters (max chamber pressure, min exit pressure) approach model limits
- Use "RESET PARAMS" to return to known-good defaults

---

*PropulsionTwin v2.0 — Built with React, Electron, and Anthropic Claude*
*For issues and contributions: github.com/yourusername/propulsiontwin*
