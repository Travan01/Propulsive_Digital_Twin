// ═══════════════════════════════════════════════════════
//  PropulsionTwin Physics Engine v2.0
//  Real thermodynamic & electromechanical equations
// ═══════════════════════════════════════════════════════

const g0 = 9.80665 // Standard gravity m/s²
const Cp_air = 1005 // J/(kg·K) specific heat air
const gamma_air = 1.4
const R_universal = 8314 // J/(kmol·K)

// ─── JET / TURBOFAN ──────────────────────────────────
export function computeJet(p) {
  const T1 = p.inletTemp + 273.15
  const pr = Math.max(1.01, p.pressureRatio)
  const eta_c = p.compressorEfficiency / 100
  const eta_t = p.turbineEfficiency / 100
  const mDot = p.massFlow
  const T3 = p.turbineInletTemp + 273.15
  const BPR = p.bypassRatio || 0

  // Isentropic compressor exit temp
  const T2s = T1 * Math.pow(pr, (gamma_air - 1) / gamma_air)
  const T2 = T1 + (T2s - T1) / eta_c
  const W_comp = mDot * Cp_air * (T2 - T1) // compressor work

  // Turbine
  const W_turbine = W_comp / eta_t
  const T4 = T3 - W_turbine / (mDot * Cp_air)
  const Ve_core = Math.sqrt(Math.max(0, 2 * eta_t * Cp_air * (T3 - T4)))

  // Bypass
  const Ve_bypass = BPR > 0 ? Math.sqrt(2 * eta_c * Cp_air * T1 * (Math.pow(pr * 0.3, (gamma_air-1)/gamma_air) - 1)) : 0
  const mDot_bypass = mDot * BPR
  const mDot_core = mDot

  const thrust_core = mDot_core * Ve_core / 1000
  const thrust_bypass = mDot_bypass * Ve_bypass / 1000
  const thrust = thrust_core + thrust_bypass

  const fuelFlow = mDot * 0.02 * (T3 / 1400) * (1 - 0.3 * (BPR / 10))
  const tsfc = fuelFlow / Math.max(0.001, thrust)
  const thermalEff = (thrust * Ve_core) / (fuelFlow * 43e6) * 100
  const power = thrust * Ve_core / 1000

  return {
    thrust: clamp(thrust, 0, 9999),
    power: clamp(power, 0, 99999),
    efficiency: clamp(thermalEff, 0, 100),
    fuelFlow: clamp(fuelFlow, 0, 9999),
    tsfc: clamp(tsfc, 0, 9.99),
    exitVelocity: clamp(Ve_core, 0, 2500),
    specificImpulse: clamp(Ve_core / g0, 0, 9999),
    compressorExitTemp: clamp(T2 - 273.15, 0, 9999),
    turbineExitTemp: clamp(T4 - 273.15, -273, 9999),
    bypassThrust: clamp(thrust_bypass, 0, 9999),
  }
}

// ─── ROCKET ──────────────────────────────────────────
export function computeRocket(p) {
  const Tc = p.chamberTemp + 273.15
  const Pc = p.chamberPressure // bar
  const Pe = p.exitPressure // bar
  const gamma = p.propellantGamma || 1.2
  const Mw = p.molecularWeight
  const mDot = p.massFlow
  const R = R_universal / Mw

  // Ideal exhaust velocity (Tsiolkovsky nozzle)
  const Ve = Math.sqrt(
    (2 * gamma / (gamma - 1)) * R * Tc *
    (1 - Math.pow(Pe / Pc, (gamma - 1) / gamma))
  )

  const Isp = Ve / g0
  const thrust = mDot * Ve / 1000

  // Expansion ratio from pressure ratio
  const Cf = gamma * Math.sqrt((2/(gamma-1)) * Math.pow(2/(gamma+1), (gamma+1)/(gamma-1))) + (Pe - 0.01013) * (50) / Pc
  const chamberArea = mDot * Math.sqrt(gamma * R * Tc) / (Pc * 1e5 * Math.sqrt(Math.pow(2/(gamma+1), (gamma+1)/(gamma-1))))

  const burnTime = p.propellantMass / mDot
  const deltaV = Ve * Math.log((p.dryMass + p.propellantMass) / p.dryMass)
  const power = thrust * Ve / 1000
  const thermalEff = Math.min(98, (Ve / 4500) * 100)

  return {
    thrust: clamp(thrust, 0, 99999),
    power: clamp(power, 0, 999999),
    efficiency: clamp(thermalEff, 0, 100),
    fuelFlow: clamp(mDot, 0, 99999),
    tsfc: clamp(mDot / Math.max(0.001, thrust), 0, 99),
    exitVelocity: clamp(Ve, 0, 5000),
    specificImpulse: clamp(Isp, 0, 999),
    deltaV: clamp(deltaV, 0, 99999),
    burnTime: clamp(burnTime, 0, 9999),
    chamberPressure: Pc,
    massRatio: clamp((p.dryMass + p.propellantMass) / p.dryMass, 1, 99),
  }
}

// ─── ELECTRIC ────────────────────────────────────────
export function computeElectric(p) {
  const eta_motor = p.motorEfficiency / 100
  const eta_batt = p.batteryEfficiency / 100
  const eta_ctrl = p.controllerEfficiency / 100
  const P_in = p.voltage * p.current // Watts
  const P_shaft = P_in * eta_motor * eta_batt * eta_ctrl
  const omega = p.rpm * 2 * Math.PI / 60 // rad/s
  const torque = omega > 0 ? P_shaft / omega : 0
  const pitchMeters = p.propellerPitch * 0.0254
  const diameter = p.propellerDiameter * 0.0254

  // Static thrust approximation (actuator disk theory)
  const rho = 1.225
  const diskArea = Math.PI * Math.pow(diameter / 2, 2)
  const thrust = Math.pow((P_shaft * P_shaft * rho * diskArea / 2), 1/3) / 1000 // kN

  const energy_kWh = p.batteryCapacity / 1e6 * p.voltage // kWh (mAh * V)
  const power_kW = P_shaft / 1000
  const endurance = energy_kWh / Math.max(0.001, power_kW) * 60 // minutes
  const Ve = diskArea > 0 ? Math.sqrt(2 * Math.max(0, thrust * 1000) / (rho * diskArea)) : 0

  return {
    thrust: clamp(thrust, 0, 999),
    power: clamp(power_kW, 0, 9999),
    efficiency: clamp(eta_motor * eta_batt * eta_ctrl * 100, 0, 100),
    fuelFlow: clamp(p.current / 1000, 0, 999), // Amps (kA equiv)
    tsfc: clamp((p.current / 1000) / Math.max(0.001, thrust), 0, 99),
    exitVelocity: clamp(Ve, 0, 999),
    specificImpulse: clamp(thrust * 1000 / Math.max(0.001, p.current / 1000 * g0), 0, 9999),
    torque: clamp(torque, 0, 99999),
    endurance: clamp(endurance, 0, 9999),
    inputPower: clamp(P_in / 1000, 0, 9999),
    heatDissipation: clamp((P_in - P_shaft) / 1000, 0, 9999),
  }
}

// ─── HYBRID ──────────────────────────────────────────
export function computeHybrid(components, params) {
  const total = components.reduce((s, c) => s + c.weight, 0) || 1
  const normalized = components.map(c => ({ ...c, w: c.weight / total }))

  const allResults = normalized.map(c => {
    let r
    if (c.type === 'jet') r = computeJet(params.jet)
    else if (c.type === 'rocket') r = computeRocket(params.rocket)
    else if (c.type === 'electric') r = computeElectric(params.electric)
    else r = {}
    return { type: c.type, w: c.w, result: r }
  })

  const merged = {}
  allResults.forEach(({ w, result }) => {
    Object.entries(result).forEach(([k, v]) => {
      if (typeof v === 'number') merged[k] = (merged[k] || 0) + v * w
    })
  })

  return { ...merged, components: allResults.map(c => ({ type: c.type, share: Math.round(c.w * 100) })) }
}

// ─── UTILS ───────────────────────────────────────────
function clamp(v, min, max) {
  if (!isFinite(v)) return min
  return Math.max(min, Math.min(max, v))
}

export const DEFAULT_PARAMS = {
  jet: {
    inletTemp: 15,
    pressureRatio: 30,
    massFlow: 120,
    turbineInletTemp: 1400,
    compressorEfficiency: 88,
    turbineEfficiency: 90,
    bypassRatio: 5,
  },
  rocket: {
    chamberTemp: 3200,
    chamberPressure: 200,
    exitPressure: 0.1,
    massFlow: 450,
    molecularWeight: 22,
    propellantGamma: 1.2,
    propellantMass: 10000,
    dryMass: 2000,
  },
  electric: {
    voltage: 400,
    current: 300,
    rpm: 8000,
    motorEfficiency: 95,
    batteryEfficiency: 97,
    controllerEfficiency: 98,
    batteryCapacity: 50000,
    propellerPitch: 12,
    propellerDiameter: 24,
  },
}

export const PARAM_META = {
  jet: [
    { key: 'inletTemp', label: 'Inlet Temperature', unit: '°C', min: -60, max: 60, step: 1 },
    { key: 'pressureRatio', label: 'Overall Pressure Ratio', unit: ':1', min: 5, max: 65, step: 0.5 },
    { key: 'massFlow', label: 'Core Mass Flow', unit: 'kg/s', min: 10, max: 600, step: 1 },
    { key: 'turbineInletTemp', label: 'Turbine Inlet Temp', unit: '°C', min: 800, max: 1800, step: 10 },
    { key: 'compressorEfficiency', label: 'Compressor Eff.', unit: '%', min: 60, max: 99, step: 0.5 },
    { key: 'turbineEfficiency', label: 'Turbine Eff.', unit: '%', min: 60, max: 99, step: 0.5 },
    { key: 'bypassRatio', label: 'Bypass Ratio', unit: 'BPR', min: 0, max: 15, step: 0.1 },
  ],
  rocket: [
    { key: 'chamberTemp', label: 'Chamber Temperature', unit: '°C', min: 1000, max: 4500, step: 50 },
    { key: 'chamberPressure', label: 'Chamber Pressure', unit: 'bar', min: 10, max: 500, step: 5 },
    { key: 'exitPressure', label: 'Nozzle Exit Pressure', unit: 'bar', min: 0.001, max: 5, step: 0.001 },
    { key: 'massFlow', label: 'Propellant Mass Flow', unit: 'kg/s', min: 10, max: 2000, step: 5 },
    { key: 'molecularWeight', label: 'Exhaust Mol. Weight', unit: 'g/mol', min: 2, max: 44, step: 0.5 },
    { key: 'propellantGamma', label: 'Specific Heat Ratio γ', unit: '', min: 1.1, max: 1.5, step: 0.01 },
    { key: 'propellantMass', label: 'Propellant Mass', unit: 'kg', min: 100, max: 500000, step: 500 },
    { key: 'dryMass', label: 'Dry Mass', unit: 'kg', min: 50, max: 100000, step: 100 },
  ],
  electric: [
    { key: 'voltage', label: 'Bus Voltage', unit: 'V', min: 24, max: 1000, step: 4 },
    { key: 'current', label: 'Current Draw', unit: 'A', min: 1, max: 2000, step: 5 },
    { key: 'rpm', label: 'Motor Speed', unit: 'RPM', min: 500, max: 50000, step: 100 },
    { key: 'motorEfficiency', label: 'Motor Efficiency', unit: '%', min: 60, max: 99, step: 0.5 },
    { key: 'batteryEfficiency', label: 'Battery Efficiency', unit: '%', min: 70, max: 99, step: 0.5 },
    { key: 'controllerEfficiency', label: 'ESC Efficiency', unit: '%', min: 80, max: 99, step: 0.5 },
    { key: 'batteryCapacity', label: 'Battery Capacity', unit: 'mAh', min: 1000, max: 500000, step: 1000 },
    { key: 'propellerPitch', label: 'Propeller Pitch', unit: 'in', min: 2, max: 30, step: 0.5 },
    { key: 'propellerDiameter', label: 'Propeller Diameter', unit: 'in', min: 4, max: 60, step: 1 },
  ],
}
