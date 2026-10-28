import axios from 'axios';

// Default production backend on Render
const DEFAULT_REMOTE_BACKEND = 'https://smart-battery-api.onrender.com';
const DEFAULT_LOCAL_BACKEND = 'http://localhost:5001';

/**
 * Determine the best backend API URL:
 * 1. User manual override stored in localStorage
 * 2. Explicit REACT_APP_API_URL environment variable (if defined and non-empty)
 * 3. Localhost fallback if running locally
 * 4. Render production backend if running on Vercel or any remote domain
 */
export const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('battery_iq_api_url');
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }
  }

  if (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.trim()) {
    return process.env.REACT_APP_API_URL.trim().replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
      return DEFAULT_LOCAL_BACKEND;
    }
    // Unified hosting (e.g. Hugging Face Spaces: same origin serves frontend + API)
    if (host.includes('onrender.com') || host.includes('hf.space') || host.includes('huggingface.co')) {
      return window.location.origin;
    }
  }

  return DEFAULT_REMOTE_BACKEND;
};

export const setApiUrl = (url) => {
  if (typeof window !== 'undefined') {
    if (!url || !url.trim()) {
      localStorage.removeItem('battery_iq_api_url');
    } else {
      localStorage.setItem('battery_iq_api_url', url.trim().replace(/\/+$/, ''));
    }
  }
};

/**
 * Health check with timeout
 */
export const checkBackendHealth = async (overrideUrl = null) => {
  const url = overrideUrl || getApiUrl();
  try {
    const res = await axios.get(`${url}/health`, { timeout: 6000 });
    return {
      status: 'healthy',
      url,
      ...res.data,
    };
  } catch (err) {
    return {
      status: 'offline',
      url,
      error: err.message,
    };
  }
};

/**
 * Fallback simulation engine when backend is cold-starting or offline
 */
export const simulatePrediction = (batteryData) => {
  const v = Number(batteryData.Voltage_measured || 3.9);
  const t = Number(batteryData.Temperature_measured || 25.0);
  const vLoad = Number(batteryData.Voltage_load || 3.8);
  const cLoad = Number(batteryData.Current_load || -1.0);
  const imp = Number(batteryData.Battery_impedance || 0.08);

  // Baseline cycle life ~380 cycles for healthy nominal 3.95V, 25C, 0.08 Ohm
  let baseRul = 380;

  // Voltage impact (lower voltage under load indicates higher cell degradation)
  const vDiff = v - 3.95;
  baseRul += vDiff * 140;

  // Temperature stress impact (>35°C accelerates degradation)
  if (t > 25) {
    baseRul -= (t - 25) * 4.5;
  }

  // Load voltage drop impact
  const vDrop = v - vLoad;
  baseRul -= (vDrop - 0.1) * 200;

  // Impedance impact (higher impedance = severe degradation)
  if (imp > 0.1) {
    baseRul -= (imp - 0.1) * 800;
  }

  // Bound prediction between 8 and 480 cycles
  const rul = Math.max(8, Math.min(480, Math.round(baseRul * 10) / 10));

  // Determine health status
  let health_status = 'HEALTHY';
  if (rul < 20) health_status = 'CRITICAL';
  else if (rul < 60) health_status = 'DEGRADED';
  else if (rul < 120) health_status = 'MODERATE';

  // Calculate synthetic SHAP contributors
  const top_contributors = [
    ['Voltage_load', Number(((vLoad - 3.85) * -120).toFixed(1))],
    ['Temperature_measured', Number(((t - 25) * -3.2).toFixed(1))],
    ['Voltage_measured', Number(((v - 3.95) * 85).toFixed(1))],
    ['Current_load', Number(((Math.abs(cLoad) - 1.0) * -45).toFixed(1))],
    ['Battery_impedance', Number(((imp - 0.08) * -210).toFixed(1))],
  ].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

  const recommendations = [];
  if (t > 40) {
    recommendations.push({
      action: 'High operating temperature detected — initiate cooling or reduce load',
      icon: '🌡️',
      priority: 'URGENT',
      reason: `Cell temperature at ${t.toFixed(1)}°C exceeds optimal 25°C boundary`,
      impact: 'Prevents thermal runaway and rapid capacity fade',
    });
  }
  if (imp > 0.15) {
    recommendations.push({
      action: 'Internal resistance elevated — schedule replacement evaluation',
      icon: '⚡',
      priority: 'WARNING',
      reason: `Measured impedance ${imp.toFixed(3)} Ω indicates SEI layer thickening`,
      impact: 'Mitigates sudden under-voltage cutoffs during peak draw',
    });
  }
  if (vLoad < 3.3) {
    recommendations.push({
      action: 'Significant load voltage sag — inspect wiring connections and cell balance',
      icon: '🔧',
      priority: 'OPERATIONAL',
      reason: 'Low terminal voltage under active discharge load',
      impact: 'Improves efficiency and power delivery stability',
    });
  }
  if (recommendations.length === 0) {
    recommendations.push({
      action: 'Continue nominal cycling and scheduled telemetry logging',
      icon: '📊',
      priority: 'PREVENTIVE',
      reason: 'Battery electrochemical metrics are within optimal operational bounds',
      impact: 'Maintains baseline life cycle expectation',
    });
  }

  return {
    prediction: rul,
    health_status,
    confidence: 0.94,
    explanation: {
      text: `Battery RUL estimated at ${rul} cycles remaining (Electrochemical simulation). Primary factors influencing prediction include ${top_contributors[0][0]} and ${top_contributors[1][0]}.`,
      top_contributors,
    },
    recommendations,
    isSimulated: true,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Predict RUL: queries live backend with automatic simulated fallback
 */
export const fetchPrediction = async (batteryData) => {
  const apiUrl = getApiUrl();
  try {
    const res = await axios.post(`${apiUrl}/predict`, batteryData, { timeout: 8000 });
    return {
      ...res.data,
      isSimulated: false,
    };
  } catch (err) {
    console.warn(`[BatteryIQ] Live API prediction failed (${err.message}). Falling back to simulation model.`);
    const simulated = simulatePrediction(batteryData);
    simulated._fallbackReason = err.response?.data?.error || err.message;
    return simulated;
  }
};

/**
 * Fetch Model Specs
 */
export const fetchModelInfo = async () => {
  const apiUrl = getApiUrl();
  try {
    const res = await axios.get(`${apiUrl}/model_info`, { timeout: 6000 });
    return res.data;
  } catch (err) {
    return {
      model_type: 'XGBoostRegressor / GradientBoosting',
      features: ['Voltage_measured', 'Current_measured', 'Temperature_measured', 'Current_load', 'Voltage_load'],
      metrics: { rmse: 194.3, mae: 80.69, r2: 0.6518 },
      training_date: 'NASA Battery Prognostics Dataset PCoE',
      isOfflineSpec: true,
    };
  }
};

/**
 * Pre-compiled domain responses for battery diagnostics when backend is waking up
 */
const DOMAIN_QA = [
  {
    keywords: ['heat', 'warm', 'temperature', 'charging'],
    topic: 'Thermal dynamics during charge',
    answer:
      'Battery heating during charging is typically caused by Joule heating (I²R losses) against internal resistance, high ambient temperature, or rapid C-rate charging. If the temperature exceeds 45°C, charging rate should be throttled immediately to prevent accelerated SEI layer growth and electrolyte decomposition.',
    recommendation: 'Charge in a well-ventilated ambient environment and avoid sustained fast charging when hot.',
    severity: 'high',
    source: 'NASA PCoE Li-Ion Diagnostics & BatteryIQ Knowledge Base',
  },
  {
    keywords: ['swell', 'bulge', 'pouch', 'expansion', 'gas'],
    topic: 'Battery swelling & outgassing',
    answer:
      'Swelling in lithium-ion pouch cells is caused by gas generation (CO₂, CO, ethylene) resulting from electrochemical decomposition of the electrolyte at over-voltage, over-temperature, or deep discharge conditions. Swollen cells pose a puncture and thermal runaway hazard and must be isolated and retired immediately.',
    recommendation: 'Disconnect power immediately, do not puncture or compress the battery, and dispose of it at an authorized recycling center.',
    severity: 'critical',
    source: 'Electrochemical Safety Standards & BatteryIQ Knowledge Base',
  },
  {
    keywords: ['lifespan', 'improve', 'extend', 'cycle', 'care'],
    topic: 'Li-Ion Life Cycle Optimization',
    answer:
      'To maximize lithium-ion lifespan: 1) Maintain the State of Charge (SOC) between 20% and 80% to minimize cathode stress. 2) Avoid charging at temperatures below 0°C (which causes lithium plating) or above 40°C. 3) Reduce fast-charging duty cycles and use moderate current loads.',
    recommendation: 'Adopt shallow discharge cycling protocols and calibrate the BMS periodically.',
    severity: 'medium',
    source: 'Battery Lifecycle Engineering Handbook',
  },
  {
    keywords: ['resistance', 'impedance', 'internal resistance', 'fade', 'capacity loss'],
    topic: 'Internal resistance correlation with capacity fade',
    answer:
      'Internal resistance (R_b) increases over cycle life due to passivation layer (SEI) thickening, active material cracking, and electrolyte dry-out. As impedance grows, the voltage drop (IR) increases under load, tripping the low-voltage cutoff earlier and causing apparent capacity loss.',
    recommendation: 'Regularly measure AC impedance / EIS spectra to detect early onset of cell degradation.',
    severity: 'medium',
    source: 'Electrochemical Impedance Spectroscopy (EIS) Reference Guide',
  },
  {
    keywords: ['drop', 'voltage drop', 'sag', 'sudden'],
    topic: 'Sudden voltage collapse diagnosis',
    answer:
      'A sharp voltage drop under load usually signifies high internal resistance, degraded interconnect resistance, or an internal micro-short. Check cell terminal torque, inspect busbars for corrosion, and verify individual cell voltages under active load.',
    recommendation: 'Inspect connections for thermal discoloration and perform load test verification.',
    severity: 'high',
    source: 'Battery Management Systems Field Service Guidelines',
  },
  {
    keywords: ['cold', 'low temperature', 'freezing', 'winter'],
    topic: 'Low-temperature performance degradation',
    answer:
      'At cold temperatures, electrolyte viscosity increases and lithium-ion diffusivity slows dramatically, leading to severe voltage sag and diminished usable capacity. Charging below freezing induces lithium metal plating on the graphite anode, permanently damaging the cell.',
    recommendation: 'Preheat cells to at least 10°C before applying charge currents.',
    severity: 'high',
    source: 'NASA Cold Environment Battery Operation Notes',
  },
];

/**
 * Query RAG Knowledge Base
 */
export const queryRagAssistant = async (query, topK = 3, provider = 'auto') => {
  const apiUrl = getApiUrl();
  try {
    const res = await axios.post(
      `${apiUrl}/rag/query`,
      { query, top_k: topK, provider },
      { timeout: 9000 }
    );
    return {
      ...res.data,
      isSimulated: false,
    };
  } catch (err) {
    console.warn(`[BatteryIQ] Live RAG query failed (${err.message}). Using grounded domain knowledge fallback.`);

    // Match keywords against domain knowledge
    const qLower = query.toLowerCase();
    let bestMatch = DOMAIN_QA.find((item) => item.keywords.some((kw) => qLower.includes(kw)));
    if (!bestMatch) {
      bestMatch = DOMAIN_QA[0];
    }

    return {
      query,
      answer: bestMatch.answer,
      provider: 'domain-knowledge-fallback',
      retrieved_documents: [
        {
          id: 101,
          topic: bestMatch.topic,
          severity: bestMatch.severity,
          score: 0.94,
          recommendation: bestMatch.recommendation,
          source: bestMatch.source,
          content: bestMatch.answer,
        },
      ],
      knowledge_base: {
        total_documents: 30,
        embedding_dimension: 384,
        vector_store: 'Local Grounded Engine',
      },
      isSimulated: true,
      timestamp: new Date().toISOString(),
    };
  }
};
