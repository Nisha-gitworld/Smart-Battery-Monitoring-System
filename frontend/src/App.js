import React, { useState, useEffect, useCallback } from 'react';
import PredictionPanel from './components/PredictionPanel';
import ShapVisualization from './components/ShapVisualization';
import RecommendationsPanel from './components/RecommendationsPanel';
import FeatureImportanceChart from './components/FeatureImportanceChart';
import BatteryAssistantPanel from './components/BatteryAssistantPanel';
import {
  getApiUrl,
  setApiUrl,
  checkBackendHealth,
  fetchPrediction,
  fetchModelInfo as apiFetchModelInfo,
} from './services/apiService';

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('battery_iq_theme') || 'light';
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendHealth, setBackendHealth] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [showModelModal, setShowModelModal] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'xai' | 'rag'

  const [apiUrlInput, setApiUrlInput] = useState(getApiUrl());
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiTestFeedback, setApiTestFeedback] = useState(null);

  const [batteryData, setBatteryData] = useState({
    Voltage_measured: 3.95,
    Current_measured: -1.0,
    Temperature_measured: 24.5,
    Current_load: -0.9,
    Voltage_load: 3.85,
    Time: 120,
    Sense_current: -1.0,
    Battery_current: -1.0,
    Current_ratio: 0.9,
    Battery_impedance: 0.08,
    Rectified_Impedance: 0.09,
    Current_charge: 1.5,
    Voltage_charge: 4.2,
  });

  // Synchronize data-theme attribute with document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('battery_iq_theme', theme);
  }, [theme]);

  // Ping backend health on mount
  const checkHealth = useCallback(async () => {
    const health = await checkBackendHealth();
    setBackendHealth(health);
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Fetch model metadata
  const handleFetchModelInfo = async () => {
    try {
      const data = await apiFetchModelInfo();
      setModelInfo(data);
      setShowModelModal(true);
    } catch (err) {
      alert('Could not retrieve model metadata. Make sure the backend is running.');
    }
  };

  const handlePredict = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPrediction(batteryData);
      setPrediction(result);
      if (result.isSimulated && backendHealth?.status !== 'healthy') {
        // Backend is offline/waking, keep health as offline
        setBackendHealth({ status: 'offline' });
      } else if (!result.isSimulated) {
        setBackendHealth((prev) => ({ ...(prev || {}), status: 'healthy' }));
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Unable to calculate battery inference. Please check your network or API endpoint.'
      );
    } finally {
      setLoading(false);
    }
  }, [batteryData, backendHealth?.status]);

  // Auto-run baseline prediction once on mount so dashboard isn't blank
  useEffect(() => {
    handlePredict();
  }, [handlePredict]);

  // Test custom API URL in modal
  const handleTestApi = async (urlToTest) => {
    setIsTestingApi(true);
    setApiTestFeedback(null);
    const start = Date.now();
    const result = await checkBackendHealth(urlToTest);
    const duration = Date.now() - start;
    setIsTestingApi(false);

    if (result.status === 'healthy') {
      setApiTestFeedback({
        success: true,
        message: `Successfully connected in ${duration}ms! Model and RAG loaded.`,
      });
      setBackendHealth(result);
    } else {
      setApiTestFeedback({
        success: false,
        message: `Could not connect to ${urlToTest}. (${result.error || 'Connection refused'}). If using Render free tier, please allow ~30s for spin-up.`,
      });
    }
  };

  const handleSaveApiUrl = (newUrl) => {
    setApiUrl(newUrl);
    setApiUrlInput(getApiUrl());
    checkHealth();
    handlePredict();
    setShowApiModal(false);
  };

  // Calculate health tier
  const getHealthMeta = (rul) => {
    if (rul === undefined || rul === null) return null;
    if (rul < 20) {
      return {
        tier: 'CRITICAL (EOL)',
        color: '#e11d48',
        badge: 'critical',
        soh: Math.max(10, Math.round((rul / 120) * 100)),
        summary: 'Imminent end of operational life. Immediate cell replacement indicated.',
      };
    }
    if (rul < 50) {
      return {
        tier: 'HIGH DEGRADATION',
        color: '#d97706',
        badge: 'warning',
        soh: Math.round((rul / 120) * 100),
        summary: 'Accelerated capacity loss. Restrict rapid charging and heavy discharge cycles.',
      };
    }
    if (rul < 85) {
      return {
        tier: 'MODERATE AGING',
        color: '#0284c7',
        badge: 'moderate',
        soh: Math.round((rul / 120) * 100),
        summary: 'Nominal operating wear. Monitor temperature and impedance during discharge.',
      };
    }
    return {
      tier: 'OPTIMAL HEALTH',
      color: '#059669',
      badge: 'healthy',
      soh: Math.min(100, Math.round((rul / 120) * 100)),
      summary: 'Optimal electrochemical stability with full capacity retention.',
    };
  };

  const health = prediction ? getHealthMeta(prediction.prediction) : null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* =========================================================================
          Glassmorphic Ambient Refraction Canvas (Adaptive Floating Orbs)
         ========================================================================= */}
      <div className="ambient-background-canvas" aria-hidden="true">
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
        <div className="ambient-orb ambient-orb-3" />
        <div className="ambient-orb ambient-orb-4" />
      </div>

      {/* =========================================================================
          Top Glass Navigation Bar
         ========================================================================= */}
      <nav
        className="glass-navbar"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        {/* Brand Logo & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.4) 0%, rgba(79, 70, 229, 0.4) 100%)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid var(--glass-border-specular)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(2, 132, 199, 0.25), var(--glass-specular-inset)',
              fontSize: '1.25rem',
            }}
          >
            🔋
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                Battery<span style={{ color: 'var(--accent-blue)' }}>IQ</span>
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: 'var(--accent-indigo)',
                  background: 'rgba(79, 70, 229, 0.12)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(79, 70, 229, 0.25)',
                  padding: '2px 8px',
                  borderRadius: 12,
                }}
              >
                GLASS 2.0
              </span>
            </div>
            <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
              Explainable Health Monitoring & RAG Diagnostics
            </div>
          </div>
        </div>

        {/* Center Navigation Tabs (Frosted Glass Pill Container) */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-nested-glass)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--glass-border)',
            borderTop: '1px solid var(--glass-border-specular)',
            borderRadius: 14,
            padding: 4,
            gap: 4,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04), var(--glass-specular-inset)',
          }}
        >
          {[
            { id: 'dashboard', label: 'Telemetry & Prediction', icon: '⚡' },
            { id: 'xai', label: 'SHAP Explainability', icon: '🧠' },
            { id: 'rag', label: 'RAG Knowledge Base', icon: '🤖' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  background: isActive
                    ? 'rgba(2, 132, 199, 0.16)'
                    : 'transparent',
                  color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--accent-blue)' : '1px solid transparent',
                  borderTop: isActive ? '1px solid var(--glass-border-specular)' : '1px solid transparent',
                  borderRadius: 10,
                  padding: '7px 16px',
                  fontSize: '0.785rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isActive ? '0 2px 10px rgba(2, 132, 199, 0.18), var(--glass-specular-inset)' : 'none',
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Status, Tools, & Theme Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Light / Dark Mode Switcher */}
          <button
            onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
            className="btn-glass-secondary"
            style={{
              padding: '6px 13px',
              borderRadius: 20,
              fontSize: '0.785rem',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            <span style={{ fontSize: '1rem' }}>{theme === 'light' ? '🌙' : '☀️'}</span>
            <span style={{ fontWeight: 700 }}>{theme === 'light' ? 'Dark' : 'Light'}</span>
          </button>

          {/* Backend Health Badge */}
          <button
            onClick={() => setShowApiModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontSize: '0.725rem',
              fontWeight: 600,
              cursor: 'pointer',
              color:
                backendHealth?.status === 'healthy'
                  ? 'var(--accent-emerald)'
                  : prediction?.isSimulated
                  ? 'var(--accent-amber)'
                  : 'var(--accent-rose)',
              background:
                backendHealth?.status === 'healthy'
                  ? 'rgba(5, 150, 105, 0.12)'
                  : prediction?.isSimulated
                  ? 'rgba(217, 119, 6, 0.12)'
                  : 'rgba(225, 29, 72, 0.12)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${
                backendHealth?.status === 'healthy'
                  ? 'rgba(5, 150, 105, 0.3)'
                  : prediction?.isSimulated
                  ? 'rgba(217, 119, 6, 0.35)'
                  : 'rgba(225, 29, 72, 0.3)'
              }`,
              padding: '5px 12px',
              borderRadius: 20,
              boxShadow: 'var(--glass-specular-inset)',
            }}
            title="Click to configure backend API endpoint or view connection details"
          >
            <span
              className={`pulse-dot ${
                backendHealth?.status === 'healthy'
                  ? 'online'
                  : prediction?.isSimulated
                  ? 'busy'
                  : 'busy'
              }`}
            />
            <span>
              {backendHealth?.status === 'healthy'
                ? 'API Online'
                : prediction?.isSimulated
                ? 'Demo / Offline'
                : 'Connecting API...'}
            </span>
            <span style={{ opacity: 0.6, fontSize: '0.65rem' }}>⚙️</span>
          </button>

          {/* Model Info Button */}
          <button
            onClick={handleFetchModelInfo}
            className="btn-glass-secondary"
            title="Inspect trained machine learning model specification"
          >
            <span>🔬</span> Model Spec
          </button>
        </div>
      </nav>

      {/* =========================================================================
          Main Content Container
         ========================================================================= */}
      <main
        style={{
          maxWidth: 1440,
          width: '100%',
          margin: '0 auto',
          padding: '24px 24px 48px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Fallback / Offline Notice Banner */}
        {prediction?.isSimulated && (
          <div
            className="glass-panel"
            style={{
              background: 'rgba(217, 119, 6, 0.12)',
              borderColor: 'rgba(217, 119, 6, 0.35)',
              borderTopColor: 'var(--glass-border-specular)',
              padding: '12px 20px',
              color: 'var(--accent-amber)',
              fontSize: '0.825rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.2rem' }}>⚡</span>
              <div>
                <strong>Running in Interactive Simulation Mode:</strong> Live backend is offline or sleeping. Displaying electrochemical predictions and SHAP estimates.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  checkHealth();
                  handlePredict();
                }}
                className="btn-glass-secondary"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                title="Attempt to reconnect to the Flask API"
              >
                🔄 Reconnect
              </button>
              <button
                onClick={() => setShowApiModal(true)}
                className="btn-glass-primary"
                style={{ padding: '4px 12px', fontSize: '0.75rem' }}
              >
                ⚙️ API Settings
              </button>
            </div>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div
            className="glass-panel"
            style={{
              background: 'rgba(225, 29, 72, 0.12)',
              borderColor: 'rgba(225, 29, 72, 0.35)',
              borderTopColor: 'var(--glass-border-specular)',
              padding: '14px 20px',
              color: 'var(--accent-rose)',
              fontSize: '0.85rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.25rem' }}>⚠️</span>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: '1rem' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* =========================================================================
            Executive Metric Cards (Glass HUD)
           ========================================================================= */}
        {health && (
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 18,
            }}
          >
            {/* Card 1: RUL */}
            <div className="glass-panel" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Remaining Useful Life
                </span>
                <span style={{ fontSize: '1.35rem' }}>⏱️</span>
              </div>
              <div style={{ marginTop: 12, marginBottom: 8 }}>
                <span style={{ fontSize: '2.6rem', fontWeight: 800, color: health.color, letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {prediction.prediction.toFixed(1)}
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginLeft: 6, fontWeight: 600 }}>
                  cycles
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className={`status-pill ${health.badge}`}>
                  {health.tier}
                </span>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  ~{(prediction.prediction * 1.5).toFixed(0)} operating hrs
                </span>
              </div>
            </div>

            {/* Card 2: Estimated State of Health (SOH) */}
            <div className="glass-panel" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  State of Health (SOH)
                </span>
                <span style={{ fontSize: '1.35rem' }}>🔋</span>
              </div>
              <div style={{ marginTop: 12, marginBottom: 8 }}>
                <span style={{ fontSize: '2.6rem', fontWeight: 800, color: 'var(--accent-blue)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {health.soh}%
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginLeft: 6, fontWeight: 600 }}>
                  capacity retention
                </span>
              </div>
              <div style={{ height: 8, background: 'var(--bg-nested-glass)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--glass-border-subtle)' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${health.soh}%`,
                    background: 'var(--gradient-glass-primary)',
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>

            {/* Card 3: Thermal Condition */}
            <div className="glass-panel" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Operating Temperature
                </span>
                <span style={{ fontSize: '1.35rem' }}>🌡️</span>
              </div>
              <div style={{ marginTop: 12, marginBottom: 8 }}>
                <span
                  style={{
                    fontSize: '2.6rem',
                    fontWeight: 800,
                    color: batteryData.Temperature_measured >= 45 ? 'var(--accent-rose)' : batteryData.Temperature_measured >= 35 ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                  }}
                >
                  {batteryData.Temperature_measured.toFixed(1)}°
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginLeft: 6, fontWeight: 600 }}>
                  Celsius
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {batteryData.Temperature_measured >= 45
                  ? '🔥 Elevated thermal stress accelerating degradation'
                  : '✓ Safe thermal envelope for Li-Ion chemistry'}
              </div>
            </div>

            {/* Card 4: Model Confidence */}
            <div className="glass-panel" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Model Confidence
                </span>
                <span style={{ fontSize: '1.35rem' }}>🎯</span>
              </div>
              <div style={{ marginTop: 12, marginBottom: 8 }}>
                <span style={{ fontSize: '2.6rem', fontWeight: 800, color: 'var(--accent-indigo)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {Math.round((prediction.confidence || 0.85) * 100)}%
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginLeft: 6, fontWeight: 600 }}>
                  dispersion index
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Based on TreeExplainer feature attributions
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            Tab Views
           ========================================================================= */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            {/* Primary Telemetry & Prediction Panel */}
            <div className="glass-panel" style={{ padding: 26 }}>
              <PredictionPanel
                prediction={prediction}
                batteryData={batteryData}
                setBatteryData={setBatteryData}
                onPredict={handlePredict}
                loading={loading}
              />
            </div>

            {/* Quick dual diagnostic charts below inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 24 }}>
              <div className="glass-panel" style={{ padding: 26 }}>
                <FeatureImportanceChart prediction={prediction} />
              </div>
              <div className="glass-panel" style={{ padding: 26 }}>
                <RecommendationsPanel prediction={prediction} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'xai' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 24 }}>
            {/* SHAP Attribution Details */}
            <div className="glass-panel" style={{ padding: 26 }}>
              <ShapVisualization prediction={prediction} />
            </div>

            {/* Interactive Feature Spectrum & Degradation Curve */}
            <div className="glass-panel" style={{ padding: 26 }}>
              <FeatureImportanceChart prediction={prediction} />
            </div>

            {/* Recommendations & Action Plan */}
            <div className="glass-panel" style={{ padding: 26, gridColumn: '1 / -1' }}>
              <RecommendationsPanel prediction={prediction} />
            </div>
          </div>
        )}

        {activeTab === 'rag' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* RAG Knowledge Assistant Panel */}
            <div className="glass-panel" style={{ padding: 26 }}>
              <BatteryAssistantPanel />
            </div>

            {/* Quick Advisory summary alongside */}
            <div className="glass-panel" style={{ padding: 26 }}>
              <RecommendationsPanel prediction={prediction} />
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          Model Spec Glass Modal
         ========================================================================= */}
      {showModelModal && (
        <div
          className="glass-modal-backdrop"
          onClick={() => setShowModelModal(false)}
        >
          <div
            className="glass-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.35rem' }}>🔬</span>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: 800 }}>
                  Machine Learning Model Specification
                </h3>
              </div>
              <button
                onClick={() => setShowModelModal(false)}
                className="btn-glass-secondary"
                style={{ padding: '4px 10px', fontSize: '0.9rem' }}
              >
                ✕
              </button>
            </div>

            {modelInfo ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: '0.85rem' }}>
                <div className="glass-nested-card" style={{ padding: 14 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Architecture: </span>
                  <strong style={{ color: 'var(--accent-blue)' }}>{modelInfo.model_type || 'RandomForestRegressor (Ensemble)'}</strong>
                </div>

                <div className="glass-nested-card" style={{ padding: 14 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Input Features Trained: </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 8 }}>
                    {(modelInfo.features || ['voltage_mean', 'current_mean', 'temperature_mean', 'voltage_min', 'current_min', 'capacity']).map((f) => (
                      <span
                        key={f}
                        style={{
                          background: 'rgba(2, 132, 199, 0.12)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(2, 132, 199, 0.3)',
                          color: 'var(--accent-blue)',
                          padding: '3px 10px',
                          borderRadius: 6,
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {modelInfo.metrics && (
                  <div className="glass-nested-card" style={{ padding: 14 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Evaluation Metrics: </span>
                    <pre style={{ color: 'var(--accent-emerald)', marginTop: 6, fontSize: '0.75rem', overflowX: 'auto' }}>
                      {JSON.stringify(modelInfo.metrics, null, 2)}
                    </pre>
                  </div>
                )}

                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1.5 }}>
                  Model trained on NASA Battery Prognostics Data Repository (Li-Ion 18650 charge/discharge test cycles).
                </div>
              </div>
            ) : (
              <div>Loading specifications...</div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          API Configuration & Diagnostics Modal
         ========================================================================= */}
      {showApiModal && (
        <div
          className="glass-modal-backdrop"
          onClick={() => setShowApiModal(false)}
        >
          <div
            className="glass-modal-box"
            style={{ maxWidth: 540 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.35rem' }}>⚙️</span>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: 800 }}>
                  Backend API & Connectivity
                </h3>
              </div>
              <button
                onClick={() => setShowApiModal(false)}
                className="btn-glass-secondary"
                style={{ padding: '4px 10px', fontSize: '0.9rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: '0.85rem' }}>
              <div className="glass-nested-card" style={{ padding: 14 }}>
                <label style={{ display: 'block', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Active API Endpoint URL
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={apiUrlInput}
                    onChange={(e) => setApiUrlInput(e.target.value)}
                    placeholder="https://smart-battery-api.onrender.com"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--glass-border)',
                      background: 'rgba(0,0,0,0.1)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                    }}
                  />
                  <button
                    onClick={() => handleTestApi(apiUrlInput)}
                    disabled={isTestingApi}
                    className="btn-glass-secondary"
                    style={{ padding: '8px 14px', whiteSpace: 'nowrap' }}
                  >
                    {isTestingApi ? 'Testing...' : 'Ping Test'}
                  </button>
                </div>

                {/* Feedback */}
                {apiTestFeedback && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: '8px 12px',
                      borderRadius: 6,
                      fontSize: '0.785rem',
                      background: apiTestFeedback.success ? 'rgba(5, 150, 105, 0.12)' : 'rgba(225, 29, 72, 0.12)',
                      color: apiTestFeedback.success ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                      border: `1px solid ${apiTestFeedback.success ? 'rgba(5, 150, 105, 0.3)' : 'rgba(225, 29, 72, 0.3)'}`,
                    }}
                  >
                    {apiTestFeedback.message}
                  </div>
                )}
              </div>

              {/* Quick Select Presets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Quick Endpoint Presets
                </span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      const url = 'https://smart-battery-api.onrender.com';
                      setApiUrlInput(url);
                      handleTestApi(url);
                    }}
                    className="btn-glass-secondary"
                    style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                  >
                    ☁️ Render Cloud Backend
                  </button>
                  <button
                    onClick={() => {
                      const url = 'http://localhost:5001';
                      setApiUrlInput(url);
                      handleTestApi(url);
                    }}
                    className="btn-glass-secondary"
                    style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                  >
                    💻 Localhost (Port 5001)
                  </button>
                  <button
                    onClick={() => {
                      setApiUrlInput('');
                      handleSaveApiUrl('');
                    }}
                    className="btn-glass-secondary"
                    style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                  >
                    🔄 Auto-Detect
                  </button>
                </div>
              </div>

              {/* Render Free Tier Note */}
              <div
                style={{
                  background: 'rgba(2, 132, 199, 0.08)',
                  border: '1px solid rgba(2, 132, 199, 0.2)',
                  borderRadius: 8,
                  padding: '12px 14px',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--accent-blue)', marginBottom: 4 }}>
                  ℹ️ Deployment & Cold Start Note
                </div>
                The cloud backend runs on Render free tier, which goes into standby after 15 minutes of inactivity. If the status is offline or waking, click <strong>Ping Test</strong> or wait ~30 seconds for the container to initialize.
                To run locally, execute <code>python backend/api.py</code> in your project terminal.
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  onClick={() => setShowApiModal(false)}
                  className="btn-glass-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveApiUrl(apiUrlInput)}
                  className="btn-glass-primary"
                  style={{ padding: '8px 18px' }}
                >
                  Save & Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          Glass Footer
         ========================================================================= */}
      <footer
        style={{
          borderTop: '1px solid var(--glass-border)',
          padding: '24px',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '0.775rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          alignItems: 'center',
          background: 'var(--bg-footer)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div>
          BatteryIQ &bull; Dual-Mode Adaptive Glassmorphic Intelligence Dashboard &bull; Research-Grade AI
        </div>
        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
          Trained on NASA Battery Aging Datasets &bull; SHAP Explainable AI Framework &bull; Grounded Vector RAG Assistant
        </div>
      </footer>
    </div>
  );
}
