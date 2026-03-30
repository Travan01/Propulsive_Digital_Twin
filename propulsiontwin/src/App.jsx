import { useState, useEffect, useRef, useCallback } from 'react'
import {
  LineChart, Line, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import {
  computeJet, computeRocket, computeElectric, computeHybrid,
  DEFAULT_PARAMS, PARAM_META
} from './physics/engine.js'

// ═══════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════
const TYPE_COLORS = { jet: '#f59e0b', rocket: '#ef4444', electric: '#22d3ee', hybrid: '#a78bfa' }
const TYPE_ICONS  = { jet: '✈', rocket: '🚀', electric: '⚡', hybrid: '🔀' }
const TYPE_DESC   = { jet: 'Turbofan / Turbojet', rocket: 'Bipropellant', electric: 'Motor + Battery', hybrid: 'Multi-Mode' }
const SEV_COLOR   = { nominal: '#22d3ee', warning: '#f59e0b', critical: '#ef4444' }

// ═══════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;700;900&display=swap');

*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#070b0f; --p1:#0c1219; --p2:#111a24; --p3:#172232;
  --b1:#1e3040; --b2:#243d52; --b3:#2d5070;
  --amber:#f59e0b; --cyan:#22d3ee; --red:#ef4444; --purple:#a78bfa;
  --green:#10b981; --txt:#c8d8e4; --txt2:#6b8ea8; --txt3:#3d6080;
  --mono:'Share Tech Mono',monospace;
  --display:'Orbitron',sans-serif;
  --body:'Rajdhani',sans-serif;
}
html,body,#root{height:100%;overflow:hidden}
body{background:var(--bg);color:var(--txt);font-family:var(--body);font-size:14px}

/* scrollbars */
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-thumb{background:var(--b2);border-radius:2px}
::-webkit-scrollbar-track{background:transparent}

/* range inputs */
input[type=range]{-webkit-appearance:none;height:3px;border-radius:2px;background:var(--b1);outline:none;cursor:pointer;width:100%}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:13px;height:13px;border-radius:50%;background:var(--accent,var(--cyan));cursor:pointer;box-shadow:0 0 8px var(--accent,var(--cyan));transition:transform .15s}
input[type=range]::-webkit-slider-thumb:hover{transform:scale(1.3)}
input[type=range]::-moz-range-thumb{width:13px;height:13px;border-radius:50%;background:var(--accent,var(--cyan));border:none;cursor:pointer}

select{cursor:pointer}

@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes scanline{0%{top:0%}100%{top:100%}}
`

// ═══════════════════════════════════════════════════════════
//  UTILITY
// ═══════════════════════════════════════════════════════════
const fmt = (v, d = 2) => {
  if (v === undefined || v === null || !isFinite(v)) return '—'
  if (Math.abs(v) >= 100000) return (v / 1000).toFixed(1) + 'k'
  if (Math.abs(v) >= 10000) return v.toFixed(0)
  if (Math.abs(v) >= 1000) return v.toFixed(1)
  return v.toFixed(d)
}

const computeResults = (mode, params, hybridComponents) => {
  try {
    if (mode === 'jet') return computeJet(params.jet)
    if (mode === 'rocket') return computeRocket(params.rocket)
    if (mode === 'electric') return computeElectric(params.electric)
    if (mode === 'hybrid') return computeHybrid(hybridComponents, params)
  } catch { return null }
  return null
}

// ═══════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════

function StatusDot({ active = true }) {
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
      background: active ? 'var(--green)' : 'var(--red)',
      animation: active ? 'pulse 2s infinite' : 'none',
      boxShadow: active ? '0 0 6px var(--green)' : 'none',
    }} />
  )
}

function KpiCard({ label, value, unit, color, sub }) {
  return (
    <div style={{
      background: 'var(--p1)', padding: '14px 18px', position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', gap: 3,
      animation: 'fadeIn .4s ease',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 3, color: 'var(--txt2)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt2)' }}>{unit}{sub ? ` · ${sub}` : ''}</div>
    </div>
  )
}

function SectionLabel({ children, color }) {
  return (
    <div style={{
      fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 3, color: color || 'var(--txt2)',
      padding: '12px 14px 8px', borderBottom: '1px solid var(--b1)', textTransform: 'uppercase',
    }}>{children}</div>
  )
}

function ParamSlider({ meta, value, type, onChange }) {
  const color = TYPE_COLORS[type]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '0 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt2)', letterSpacing: .5 }}>{meta.label}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color }}>
          {value}<span style={{ fontSize: 9, color: 'var(--txt2)', marginLeft: 3 }}>{meta.unit}</span>
        </span>
      </div>
      <input
        type="range" min={meta.min} max={meta.max} step={meta.step}
        value={value} style={{ '--accent': color }}
        onChange={e => onChange(meta.key, parseFloat(e.target.value))}
      />
    </div>
  )
}

function ChartPanel({ title, children }) {
  return (
    <div style={{ background: 'var(--p1)', padding: '14px 16px' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 2, color: 'var(--txt2)', marginBottom: 10, textTransform: 'uppercase' }}>{title}</div>
      {children}
    </div>
  )
}

function AiInsightCard({ insight, i }) {
  const color = SEV_COLOR[insight.severity] || 'var(--purple)'
  return (
    <div style={{
      background: 'var(--p2)', border: `1px solid ${color}33`, borderRadius: 4,
      padding: '12px 14px', position: 'relative', overflow: 'hidden',
      animation: `fadeIn .4s ease ${i * 0.1}s both`,
    }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: color }} />
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 2, color, marginBottom: 5, textTransform: 'uppercase' }}>
        [{insight.severity?.toUpperCase()}] {insight.title}
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.65, color: 'var(--txt)' }}>{insight.text}</div>
    </div>
  )
}

function ManualModal({ onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(7,11,15,0.92)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--p1)', border: '1px solid var(--b2)', borderRadius: 8,
        width: '700px', maxHeight: '80vh', overflowY: 'auto', padding: '32px',
        animation: 'fadeIn .3s ease',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: 'var(--display)', fontSize: 16, letterSpacing: 2, color: 'var(--cyan)', marginBottom: 6 }}>PROPULSIONTWIN — USER MANUAL</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--txt2)', marginBottom: 24, letterSpacing: 2 }}>VERSION 2.0 · QUICK REFERENCE GUIDE</div>
        {[
          { h: '1. OVERVIEW', t: 'PropulsionTwin is a digital twin simulation environment for engineering analysis of propulsion systems. It combines real thermodynamic physics with Claude AI insights to give you both quantitative results and qualitative engineering guidance.' },
          { h: '2. PROPULSION MODES', t: 'JET — Simulates turbofan/turbojet Brayton cycle thermodynamics. Key parameters: pressure ratio, mass flow, turbine inlet temperature, bypass ratio.\n\nROCKET — Bipropellant rocket engine using ideal nozzle flow equations. Key parameters: chamber conditions, propellant mass, molecular weight.\n\nELECTRIC — Actuator disk theory + electromechanical model. Key parameters: voltage, current, RPM, propeller geometry.\n\nHYBRID — Weighted blend of any combination. Adjust power-share sliders to define the operating point.' },
          { h: '3. PARAMETER TUNING', t: 'All sliders update the simulation in real-time. Historical traces on charts track the last 60 parameter states. Hover any chart for tooltips.' },
          { h: '4. AI INSIGHT ENGINE', t: 'After each parameter change, the system sends telemetry to Claude AI which returns 3 engineering insights tagged as NOMINAL (operational), WARNING (approaching limits), or CRITICAL (intervention needed). Requires internet connection.' },
          { h: '5. HYBRID COMPOSER', t: 'Add up to 3 propulsion components. Each component\'s contribution is weighted by its slider. Weights are normalized to 100% automatically.' },
          { h: '6. EXPORTING REPORTS', t: 'Click "EXPORT SIMULATION REPORT" or press Ctrl+E. A native save dialog opens. Reports are plain text containing: all metric values, all parameter settings, and AI insight summaries.' },
          { h: '7. SESSIONS', t: 'Use File > Save/Load Session to persist your parameter configurations as JSON files. Share these with colleagues to reproduce exact simulation states.' },
          { h: '8. KEYBOARD SHORTCUTS', t: 'Ctrl+1/2/3/4 — Switch modes\nCtrl+E — Export report\nCtrl+N — New simulation\nF11 — Fullscreen\nCtrl+=/- — Zoom\nCtrl+R — Reload' },
          { h: '9. PHYSICS MODELS', t: 'Jet: Isentropic compressor/turbine with BPR correction\nRocket: Ideal rocket equation with expansion ratio optimization\nElectric: Actuator disk theory + electrochemical efficiency chain\nAll models validated against standard aerospace engineering references.' },
        ].map((s, i) => (
          <div key={i} style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--amber)', letterSpacing: 2, marginBottom: 8 }}>{s.h}</div>
            <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--txt)', whiteSpace: 'pre-line' }}>{s.t}</div>
          </div>
        ))}
        <button onClick={onClose} style={{
          width: '100%', padding: 12, marginTop: 8,
          background: 'rgba(34,211,238,0.1)', border: '1px solid var(--b2)',
          borderRadius: 4, color: 'var(--cyan)', fontFamily: 'var(--mono)',
          fontSize: 11, letterSpacing: 2, cursor: 'pointer',
        }}>CLOSE MANUAL [ESC]</button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════
export default function App() {
  const [mode, setMode] = useState('jet')
  const [params, setParams] = useState(JSON.parse(JSON.stringify(DEFAULT_PARAMS)))
  const [hybridComponents, setHybridComponents] = useState([
    { type: 'jet', weight: 60 },
    { type: 'electric', weight: 40 },
  ])
  const [results, setResults] = useState(null)
  const [history, setHistory] = useState([])
  const [aiInsights, setAiInsights] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [tick, setTick] = useState(0)
  const [sessionTime, setSessionTime] = useState(0)
  const aiDebounce = useRef(null)
  const sessionTimer = useRef(null)

  // Session timer
  useEffect(() => {
    sessionTimer.current = setInterval(() => setSessionTime(t => t + 1), 1000)
    return () => clearInterval(sessionTimer.current)
  }, [])

  // Electron menu listeners
  useEffect(() => {
    if (!window.electronAPI) return
    window.electronAPI.onMenuMode(m => setMode(m))
    window.electronAPI.onMenuManual(() => setShowManual(true))
    window.electronAPI.onMenuNew(() => {
      setParams(JSON.parse(JSON.stringify(DEFAULT_PARAMS)))
      setHistory([])
      setAiInsights([])
    })
    window.electronAPI.onMenuExport(() => handleExport())
  }, [])

  // ESC closes manual
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') setShowManual(false) }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  // Compute physics
  useEffect(() => {
    const r = computeResults(mode, params, hybridComponents)
    if (!r) return
    setResults(r)
    setHistory(prev => [...prev, { t: prev.length, ...r }].slice(-80))
    setTick(t => t + 1)
  }, [params, mode, hybridComponents])

  // AI insights (debounced 1.8s after last change)
  useEffect(() => {
    if (!results) return
    if (aiDebounce.current) clearTimeout(aiDebounce.current)
    aiDebounce.current = setTimeout(() => fetchAI(results, mode), 1800)
    return () => clearTimeout(aiDebounce.current)
  }, [tick])

  const fetchAI = async (r, m) => {
    setAiLoading(true)
    try {
      const summary = Object.entries(r)
        .filter(([, v]) => typeof v === 'number')
        .map(([k, v]) => `${k}: ${v.toFixed(3)}`)
        .join(', ')
      const paramSummary = Object.entries(params[m === 'hybrid' ? 'jet' : m] || {})
        .map(([k, v]) => `${k}=${v}`)
        .join(', ')

      const prompt = `You are a senior propulsion engineer AI. Analyze these simulation results for a ${m} propulsion system.

Performance metrics: ${summary}
Parameters: ${paramSummary}

Provide exactly 3 engineering insights as a JSON array:
[{"title":"SHORT_TITLE","text":"2-3 sentence technical insight","severity":"nominal"|"warning"|"critical"}]

Rules:
- nominal = operating within expected bounds, positive optimization suggestion
- warning = approaching limits or suboptimal, actionable recommendation
- critical = exceeding physical limits or dangerous operating point
- Be specific with numbers from the data
- Focus on: thermal efficiency, structural limits, fuel economy, specific impulse optimization
- Return ONLY valid JSON array, no markdown, no preamble`

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const data = await res.json()
      const text = data.content?.map(c => c.text || '').join('') || '[]'
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setAiInsights(Array.isArray(parsed) ? parsed : [])
    } catch {
      setAiInsights([{
        title: 'OFFLINE MODE',
        text: 'AI insights unavailable. Physics simulation is fully operational. Connect to the internet to enable Claude AI engineering analysis.',
        severity: 'nominal'
      }])
    }
    setAiLoading(false)
  }

  const updateParam = useCallback((type, key, value) => {
    setParams(prev => ({ ...prev, [type]: { ...prev[type], [key]: value } }))
  }, [])

  const handleExport = async () => {
    if (!results) return
    const lines = [
      '╔══════════════════════════════════════════════════════════╗',
      '║         PROPULSIONTWIN — SIMULATION REPORT v2.0         ║',
      '╚══════════════════════════════════════════════════════════╝',
      '',
      `  Generated : ${new Date().toISOString()}`,
      `  Mode      : ${mode.toUpperCase()}`,
      `  Session   : T+${Math.floor(sessionTime / 60)}m ${sessionTime % 60}s`,
      '',
      '──────────────────────────────────────────────────────────',
      '  PERFORMANCE METRICS',
      '──────────────────────────────────────────────────────────',
      ...Object.entries(results)
        .filter(([, v]) => typeof v === 'number')
        .map(([k, v]) => `  ${k.padEnd(24)} ${v.toFixed(6)}`),
      '',
      '──────────────────────────────────────────────────────────',
      '  PARAMETERS',
      '──────────────────────────────────────────────────────────',
      ...(mode === 'hybrid'
        ? hybridComponents.map(c => `  ${c.type.toUpperCase().padEnd(10)} @ ${c.weight}%`)
        : Object.entries(params[mode]).map(([k, v]) => `  ${k.padEnd(24)} ${v}`)
      ),
      '',
      '──────────────────────────────────────────────────────────',
      '  AI ENGINEERING INSIGHTS',
      '──────────────────────────────────────────────────────────',
      ...aiInsights.map((ins, i) => [
        `  ${i + 1}. [${(ins.severity || 'info').toUpperCase()}] ${ins.title}`,
        `     ${ins.text}`,
        ''
      ]).flat(),
      '──────────────────────────────────────────────────────────',
      `  Total history samples: ${history.length}`,
      '╔══════════════════════════════════════════════════════════╗',
      '║                  END OF REPORT                          ║',
      '╚══════════════════════════════════════════════════════════╝',
    ]
    const content = lines.join('\n')
    if (window.electronAPI) {
      await window.electronAPI.saveReport(content)
    } else {
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `propulsion-report-${Date.now()}.txt`; a.click()
      URL.revokeObjectURL(url)
    }
  }

  // Radar data
  const radarData = results ? [
    { m: 'THRUST', v: Math.min(100, (results.thrust || 0) / 5) },
    { m: 'EFFIC', v: Math.min(100, results.efficiency || 0) },
    { m: 'ISP', v: Math.min(100, ((results.specificImpulse || 0) / 5)) },
    { m: 'POWER', v: Math.min(100, (results.power || 0) / 10) },
    { m: 'Ve', v: Math.min(100, ((results.exitVelocity || 0) / 50)) },
  ] : []

  const accent = TYPE_COLORS[mode]
  const activeTypes = mode === 'hybrid' ? [...new Set(hybridComponents.map(c => c.type))] : [mode]

  const fmtTime = s => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  // ── RENDER ──────────────────────────────────────────────
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      {showManual && <ManualModal onClose={() => setShowManual(false)} />}

      <div style={{ height: '100vh', display: 'grid', gridTemplateRows: 'auto 1fr', background: 'var(--bg)' }}>

        {/* ── HEADER ── */}
        <header style={{
          padding: '10px 24px', borderBottom: '1px solid var(--b1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(12,18,25,0.95)', backdropFilter: 'blur(12px)',
          position: 'relative', zIndex: 50,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, background: `linear-gradient(135deg, var(--cyan), var(--amber))`,
              borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>🛸</div>
            <div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, letterSpacing: 3 }}>
                PROPULSION<span style={{ color: 'var(--cyan)' }}>TWIN</span>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--txt2)', letterSpacing: 3 }}>DIGITAL SIMULATION ENVIRONMENT v2.0</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt2)' }}>
              SESSION <span style={{ color: 'var(--cyan)' }}>{fmtTime(sessionTime)}</span>
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt2)' }}>
              MODE <span style={{ color: accent }}>{mode.toUpperCase()}</span>
            </div>
            <button onClick={() => setShowManual(true)} style={{
              background: 'rgba(34,211,238,0.07)', border: '1px solid var(--b2)', borderRadius: 4,
              padding: '5px 12px', color: 'var(--cyan)', fontFamily: 'var(--mono)', fontSize: 9,
              letterSpacing: 2, cursor: 'pointer', textTransform: 'uppercase',
            }}>MANUAL</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7,
              padding: '5px 12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: 4, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--green)', letterSpacing: 2
            }}>
              <StatusDot /> SIM ACTIVE
            </div>
          </div>
        </header>

        {/* ── BODY ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr 300px', overflow: 'hidden' }}>

          {/* ─ LEFT SIDEBAR ─ */}
          <aside style={{ borderRight: '1px solid var(--b1)', overflowY: 'auto', background: 'var(--p1)', display: 'flex', flexDirection: 'column', gap: 0 }}>

            {/* Type selector */}
            <SectionLabel>// propulsion type</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 10 }}>
              {['jet', 'rocket', 'electric', 'hybrid'].map(t => (
                <button key={t} onClick={() => setMode(t)} style={{
                  background: mode === t ? `${TYPE_COLORS[t]}12` : 'var(--p2)',
                  border: `1px solid ${mode === t ? TYPE_COLORS[t] : 'var(--b1)'}`,
                  borderRadius: 4, padding: '10px 6px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  transition: 'all .2s',
                }}>
                  <span style={{ fontSize: 18 }}>{TYPE_ICONS[t]}</span>
                  <span style={{ fontFamily: 'var(--body)', fontSize: 11, fontWeight: 700, letterSpacing: 1, color: mode === t ? TYPE_COLORS[t] : 'var(--txt)', textTransform: 'uppercase' }}>{t}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--txt2)' }}>{TYPE_DESC[t]}</span>
                </button>
              ))}
            </div>

            {/* Hybrid Composer */}
            {mode === 'hybrid' && <>
              <SectionLabel color={TYPE_COLORS.hybrid}>// hybrid composer</SectionLabel>
              <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {hybridComponents.map((c, i) => (
                  <div key={i} style={{
                    background: 'var(--p2)', border: `1px solid ${TYPE_COLORS[c.type]}44`,
                    borderRadius: 4, padding: '10px 12px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <select value={c.type}
                        onChange={e => setHybridComponents(prev => prev.map((x, j) => j === i ? { ...x, type: e.target.value } : x))}
                        style={{ background: 'var(--p1)', border: 'none', color: TYPE_COLORS[c.type], fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: 1 }}
                      >
                        {['jet','rocket','electric'].map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {t.toUpperCase()}</option>)}
                      </select>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: TYPE_COLORS[c.type] }}>{c.weight}%</span>
                        {hybridComponents.length > 2 && (
                          <button onClick={() => setHybridComponents(p => p.filter((_, j) => j !== i))}
                            style={{ width: 20, height: 20, background: 'rgba(239,68,68,.12)', border: '1px solid var(--b1)', borderRadius: 2, color: 'var(--red)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                        )}
                      </div>
                    </div>
                    <input type="range" min={5} max={90} value={c.weight}
                      style={{ '--accent': TYPE_COLORS[c.type] }}
                      onChange={e => setHybridComponents(p => p.map((x, j) => j === i ? { ...x, weight: parseInt(e.target.value) } : x))}
                    />
                  </div>
                ))}
                {hybridComponents.length < 3 && (
                  <button onClick={() => {
                    const used = hybridComponents.map(c => c.type)
                    const avail = ['jet', 'rocket', 'electric'].find(t => !used.includes(t))
                    if (avail) setHybridComponents(p => [...p, { type: avail, weight: 33 }])
                  }} style={{
                    background: 'rgba(167,139,250,.05)', border: '1px dashed var(--b2)', borderRadius: 4,
                    padding: 10, cursor: 'pointer', color: 'var(--purple)', fontFamily: 'var(--mono)',
                    fontSize: 10, letterSpacing: 2, textAlign: 'center',
                  }}>+ ADD COMPONENT</button>
                )}
              </div>
            </>}

            {/* Params */}
            {activeTypes.map(type => (
              <div key={type}>
                <SectionLabel color={TYPE_COLORS[type]}>// {type} parameters</SectionLabel>
                <div style={{ padding: '10px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(PARAM_META[type] || []).map(meta => (
                    <ParamSlider
                      key={meta.key} meta={meta}
                      value={params[type][meta.key]}
                      type={type}
                      onChange={(k, v) => updateParam(type, k, v)}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Session controls */}
            <SectionLabel>// session</SectionLabel>
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'RESET PARAMS', fn: () => setParams(JSON.parse(JSON.stringify(DEFAULT_PARAMS))), color: 'var(--amber)' },
                { label: 'CLEAR HISTORY', fn: () => setHistory([]), color: 'var(--txt2)' },
              ].map(btn => (
                <button key={btn.label} onClick={btn.fn} style={{
                  padding: '7px 0', background: 'var(--p2)', border: '1px solid var(--b1)',
                  borderRadius: 4, cursor: 'pointer', color: btn.color,
                  fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 2,
                }}>{btn.label}</button>
              ))}
            </div>
          </aside>

          {/* ─ CENTER ─ */}
          <main style={{ overflowY: 'auto', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

            {/* KPI Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: 'var(--b1)', borderBottom: '1px solid var(--b1)', flexShrink: 0 }}>
              <KpiCard label="Thrust" value={fmt(results?.thrust)} unit="kN" color={accent} />
              <KpiCard label="Power Output" value={fmt(results?.power)} unit="kW" color="var(--green)" />
              <KpiCard label="Specific Impulse" value={fmt(results?.specificImpulse, 0)} unit="sec" color="var(--amber)" />
              <KpiCard label="Efficiency" value={fmt(results?.efficiency)} unit="%" color="var(--purple)" />
            </div>

            {/* Secondary KPI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: 'var(--b1)', borderBottom: '1px solid var(--b1)', flexShrink: 0 }}>
              <KpiCard label="Exit Velocity" value={fmt(results?.exitVelocity)} unit="m/s" color="var(--cyan)" />
              <KpiCard label="Fuel / Mass Flow" value={fmt(results?.fuelFlow)} unit="kg/s" color="var(--red)" />
              <KpiCard label="TSFC" value={fmt(results?.tsfc, 4)} unit="kg/(N·s)" color="var(--txt2)" />
              {results?.deltaV !== undefined
                ? <KpiCard label="Delta-V" value={fmt(results.deltaV)} unit="m/s" color="var(--amber)" />
                : results?.endurance !== undefined
                ? <KpiCard label="Endurance" value={fmt(results.endurance, 0)} unit="min" color="var(--green)" />
                : <KpiCard label="Bypass Thrust" value={fmt(results?.bypassThrust)} unit="kN" color="var(--txt)" />
              }
            </div>

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--b1)', flex: 1 }}>

              <ChartPanel title="// thrust history">
                <ResponsiveContainer width="100%" height={155}>
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={accent} stopOpacity={.35} />
                        <stop offset="100%" stopColor={accent} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 5" stroke="rgba(255,255,255,.03)" />
                    <XAxis dataKey="t" tick={false} axisLine={false} />
                    <YAxis tick={{ fontFamily: 'Share Tech Mono', fontSize: 9, fill: '#6b8ea8' }} width={38} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0c1219', border: '1px solid #1e3040', fontFamily: 'Share Tech Mono', fontSize: 10 }} />
                    <Area type="monotone" dataKey="thrust" stroke={accent} fill="url(#tg)" strokeWidth={1.5} dot={false} name="Thrust kN" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartPanel>

              <ChartPanel title="// efficiency · exit velocity">
                <ResponsiveContainer width="100%" height={155}>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="2 5" stroke="rgba(255,255,255,.03)" />
                    <XAxis dataKey="t" tick={false} axisLine={false} />
                    <YAxis yAxisId="l" tick={{ fontFamily: 'Share Tech Mono', fontSize: 9, fill: '#6b8ea8' }} width={38} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="r" orientation="right" tick={{ fontFamily: 'Share Tech Mono', fontSize: 9, fill: '#6b8ea8' }} width={42} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0c1219', border: '1px solid #1e3040', fontFamily: 'Share Tech Mono', fontSize: 10 }} />
                    <Line yAxisId="l" type="monotone" dataKey="efficiency" stroke="var(--green)" strokeWidth={1.5} dot={false} name="Efficiency %" />
                    <Line yAxisId="r" type="monotone" dataKey="exitVelocity" stroke="var(--amber)" strokeWidth={1.5} dot={false} name="Ve m/s" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartPanel>

              <ChartPanel title="// power output history">
                <ResponsiveContainer width="100%" height={155}>
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={.3} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 5" stroke="rgba(255,255,255,.03)" />
                    <XAxis dataKey="t" tick={false} axisLine={false} />
                    <YAxis tick={{ fontFamily: 'Share Tech Mono', fontSize: 9, fill: '#6b8ea8' }} width={38} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0c1219', border: '1px solid #1e3040', fontFamily: 'Share Tech Mono', fontSize: 10 }} />
                    <Area type="monotone" dataKey="power" stroke="var(--green)" fill="url(#pg)" strokeWidth={1.5} dot={false} name="Power kW" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartPanel>

              <ChartPanel title="// performance envelope">
                <ResponsiveContainer width="100%" height={155}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                    <PolarGrid stroke="rgba(255,255,255,.07)" />
                    <PolarAngleAxis dataKey="m" tick={{ fontFamily: 'Share Tech Mono', fontSize: 9, fill: '#6b8ea8' }} />
                    <Radar dataKey="v" stroke={accent} fill={accent} fillOpacity={.15} strokeWidth={1.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartPanel>
            </div>

            {/* Telemetry bar */}
            <div style={{
              borderTop: '1px solid var(--b1)', padding: '7px 16px',
              display: 'flex', gap: 18, overflowX: 'auto',
              background: 'rgba(0,0,0,.4)', flexShrink: 0,
            }}>
              {results && Object.entries(results)
                .filter(([, v]) => typeof v === 'number')
                .slice(0, 10)
                .map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 5, alignItems: 'center', whiteSpace: 'nowrap' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--txt2)', letterSpacing: 1 }}>{k.toUpperCase()}:</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: accent }}>{v.toFixed(3)}</span>
                  </div>
                ))}
              <div style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--txt3)', whiteSpace: 'nowrap' }}>
                T+{String(history.length).padStart(4, '0')} · {new Date().toISOString()}
              </div>
            </div>
          </main>

          {/* ─ RIGHT PANEL ─ */}
          <aside style={{ borderLeft: '1px solid var(--b1)', overflowY: 'auto', background: 'var(--p1)', display: 'flex', flexDirection: 'column' }}>

            {/* AI Header */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{
                background: 'linear-gradient(135deg,rgba(167,139,250,.25),rgba(34,211,238,.25))',
                border: '1px solid var(--purple)', padding: '3px 8px', borderRadius: 2,
                fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: 3, color: 'var(--purple)',
              }}>AI</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 11, letterSpacing: 2 }}>INSIGHT ENGINE</div>
              <StatusDot active={!aiLoading} />
            </div>

            {/* AI Content */}
            <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
              {aiLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 0', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--purple)' }}>
                  <div style={{ width: 14, height: 14, border: '2px solid var(--b2)', borderTopColor: 'var(--purple)', borderRadius: '50%', animation: 'spin .8s linear infinite', flexShrink: 0 }} />
                  ANALYZING TELEMETRY...
                </div>
              ) : aiInsights.length > 0 ? (
                aiInsights.map((ins, i) => <AiInsightCard key={i} insight={ins} i={i} />)
              ) : (
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt2)', padding: '12px 0' }}>Adjust parameters to trigger analysis.</div>
              )}
            </div>

            {/* All Metrics */}
            <SectionLabel>// all metrics</SectionLabel>
            <div style={{ padding: '8px 14px', flex: 1 }}>
              {results && Object.entries(results)
                .filter(([, v]) => typeof v === 'number')
                .map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(30,48,64,.6)' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--txt2)', letterSpacing: 1, textTransform: 'uppercase' }}>{k}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: accent }}>{v.toFixed(4)}</span>
                  </div>
                ))
              }
            </div>

            {/* Export */}
            <button onClick={handleExport} style={{
              margin: '10px 12px', padding: 12,
              background: 'linear-gradient(135deg,rgba(34,211,238,.08),rgba(167,139,250,.08))',
              border: '1px solid var(--b2)', borderRadius: 4,
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: 2, color: 'var(--cyan)',
              cursor: 'pointer', textAlign: 'center', flexShrink: 0,
              transition: 'all .2s',
            }}>⬇ EXPORT SIMULATION REPORT</button>
          </aside>

        </div>
      </div>
    </>
  )
}
