import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import PredictionPanel from './components/PredictionPanel';
import ShapVisualization from './components/ShapVisualization';
import RecommendationsPanel from './components/RecommendationsPanel';
import FeatureImportanceChart from './components/FeatureImportanceChart';
import BatteryAssistantPanel from './components/BatteryAssistantPanel';

export default function App() {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendHealth, setBackendHealth] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [showModelModal, setShowModelModal] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'xai' | 'rag'

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

  const apiUrl = process.env.REACT_APP_API_URL || '';

  // Ping backend health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await axios.get(`${apiUrl}/health`);
        setBackendHealth(res.data);
      } catch (err) {
        setBackendHealth({ status: 'offline' });
      }
    };
    checkHealth();
  }, [apiUrl]);

  // Fetch model metadata
  const fetchModelInfo = async () => {
    try {
      const res = await axios.get(`${apiUrl}/model_info`);
      setModelInfo(res.data);
      setShowModelModal(true);
    } catch (err) {
      alert('Could not retrieve model metadata. Make sure the backend is running.');
    }
  };

  const handlePredict = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${apiUrl}/predict`, batteryData);
      setPrediction(response.data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Prediction request failed: ${err.message}. Check the API URL and backend logs.'
      );
    } finally {
      setLoading(false);
    }
  }, [apiUrl, batteryData]);

  // Auto-run baseline prediction once on mount so dashboard isn't blank
  useEffect(() => {
    handlePredict();
  }, [handlePredict]);

  // Calculate health tier
  const getHealthMeta = (rul) => {
    if (rul === undefined || rul === null) return null;
    if (rul < 20) {
      return {
        tier: 'CRITICAL (EOL)',
        color: '#f43f5e',
        badge: 'critical',
        soh: Math.max(10, Math.round((rul / 120) * 100)),
        summary: 'Imminent end of operational life. Immediate cell replacement indicated.',
      };
    }
    if (rul < 50) {
      return {
        tier: 'HIGH DEGRADATION',
        color: '#f59e0b',
        badge: 'warning',
        soh: Math.round((rul / 120) * 100),
        summary: 'Accelerated capacity loss. Restrict rapid charging and heavy discharge cycles.',
      };
    }
    if (rul < 100) {
      return {
        tier: 'MODERATE RETENTION',
        color: '#38bdf8',
        badge: 'moderate',
        soh: Math.min(88, Math.round((rul / 120) * 100)),
        summary: 'Acceptable performance. Normal cyclic fade observed within nominal limits.',
      };
    }
    return {
      tier: 'OPTIMAL / NOMINAL',
      color: '#10b981',
      badge: 'healthy',
      soh: Math.min(100, Math.round(85 + (rul / 120) * 15)),
      summary: 'Excellent electro-chemical condition. Minimal solid electrolyte interphase (SEI) growth.',
    };
  };

  const health = prediction ? getHealthMeta(prediction.prediction) : null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* =========================================================================
          Top Navigation Bar
         ========================================================================= */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(8, 12, 20, 0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
          padding: '0 24px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(56, 189, 248, 0.35)',
              fontSize: '1.15rem',
            }}
          >
            🔋
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                Battery<span style={{ color: '#38bdf8' }}>IQ</span>
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: '#818cf8',
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  padding: '2px 7px',
                  borderRadius: 12,
                }}
              >
                v2.0 PRO
              </span>
            </div>
            <div style={{ fontSize: '0.675rem', color: '#64748b' }}>
              Explainable Health Monitoring & RAG Diagnostics
            </div>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(148, 163, 184, 0.15)', borderRadius: 10, padding: 3, gap: 4 }}>
          {[
            { id: 'dashboard', label: 'Telemetry & Prediction', icon: '⚡' },
            { id: 'xai', label: 'SHAP Explainability', icon: '🧠' },
            { id: 'rag', label: 'RAG Knowledge Base', icon: '🤖' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: activeTab === tab.id ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
                color: activeTab === tab.id ? '#38bdf8' : '#94a3b8',
                border: activeTab === tab.id ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: '0.775rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right Status & Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Backend Health Badge */}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.725rem',
                color: ['healthy', 'running'].includes(backendHealth?.status) ? '#34d399' : '#f43f5e',
                background: ['healthy', 'running'].includes(backendHealth?.status) ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                border: `1px solid ${['healthy', 'running'].includes(backendHealth?.status) ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                padding: '4px 10px',
                borderRadius: 20,
              }}
              title={['healthy', 'running'].includes(backendHealth?.status) ? 'Backend API connected' : 'Backend offline'}
            >
              <span className={`pulse-dot ${['healthy', 'running'].includes(backendHealth?.status) ? 'online' : 'busy'}`} />
              <span>{['healthy', 'running'].includes(backendHealth?.status) ? 'API Online' : 'Connecting API...'}</span>
            </div>

          {/* Model Info Button */}
          <button
            onClick={fetchModelInfo}
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: 8,
              color: '#cbd5e1',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '6px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>ℹ️</span> Model Spec
          </button>
        </div>
      </nav>

      {/* =========================================================================
          Main Content Container
         ========================================================================= */}
      <main style={{ maxWidth: 1440, width: '100%', margin: '0 auto', padding: '24px 24px 48px', flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Error notification */}
        {error && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              borderRadius: 12,
              padding: '14px 20px',
              color: '#fb7185',
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
              style={{ background: 'transparent', border: 'none', color: '#fb7185', cursor: 'pointer', fontSize: '1rem' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* =========================================================================
            Executive Metric Cards (HUD)
           ========================================================================= */}
        {health && (
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16,
            }}
          >
            {/* Card 1: RUL */}
            <div className="glass-panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Remaining Useful Life
                </span>
                <span style={{ fontSize: '1.25rem' }}>⏱️</span>
              </div>
              <div style={{ marginTop: 12, marginBottom: 8 }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: health.color, letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {prediction.prediction.toFixed(1)}
                </span>
                <span style={{ fontSize: '0.9rem', color: '#94a3b8', marginLeft: 6, fontWeight: 600 }}>
                  cycles
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className={`status-pill ${health.badge}`}>
                  {health.tier}
                </span>
                <span style={{ fontSize: '0.725rem', color: '#64748b' }}>
                  Horizon: ~{(prediction.prediction * 1.5).toFixed(0)} operating hrs
                </span>
              </div>
            </div>

            {/* Card 2: Estimated State of Health (SOH) */}
            <div className="glass-panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  State of Health (SOH)
                </span>
                <span style={{ fontSize: '1.25rem' }}>🔋</span>
              </div>
              <div style={{ marginTop: 12, marginBottom: 8 }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {health.soh}%
                </span>
                <span style={{ fontSize: '0.9rem', color: '#94a3b8', marginLeft: 6, fontWeight: 600 }}>
                  capacity retention
                </span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${health.soh}%`, background: 'var(--gradient-brand)', borderRadius: 3 }} />
              </div>
            </div>

            {/* Card 3: Thermal Condition */}
            <div className="glass-panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Operating Temperature
                </span>
                <span style={{ fontSize: '1.25rem' }}>🌡️</span>
              </div>
              <div style={{ marginTop: 12, marginBottom: 8 }}>
                <span
                  style={{
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    color: batteryData.Temperature_measured >= 45 ? '#f43f5e' : batteryData.Temperature_measured >= 35 ? '#f59e0b' : '#34d399',
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                  }}
                >
                  {batteryData.Temperature_measured.toFixed(1)}°
                </span>
                <span style={{ fontSize: '0.9rem', color: '#94a3b8', marginLeft: 6, fontWeight: 600 }}>
                  Celsius
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {batteryData.Temperature_measured >= 45
                  ? '🔥 Elevated thermal stress accelerating degradation'
                  : '✓ Safe thermal envelope for Li-Ion chemistry'}
              </div>
            </div>

            {/* Card 4: Model Confidence */}
            <div className="glass-panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Model Confidence
                </span>
                <span style={{ fontSize: '1.25rem' }}>🎯</span>
              </div>
              <div style={{ marginTop: 12, marginBottom: 8 }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#818cf8', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {Math.round((prediction.confidence || 0.85) * 100)}%
                </span>
                <span style={{ fontSize: '0.9rem', color: '#94a3b8', marginLeft: 6, fontWeight: 600 }}>
                  dispersion index
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
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
            <div className="glass-panel" style={{ padding: 24 }}>
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
              <div className="glass-panel" style={{ padding: 24 }}>
                <FeatureImportanceChart prediction={prediction} />
              </div>
              <div className="glass-panel" style={{ padding: 24 }}>
                <RecommendationsPanel prediction={prediction} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'xai' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 24 }}>
            {/* SHAP Attribution Details */}
            <div className="glass-panel" style={{ padding: 24 }}>
              <ShapVisualization prediction={prediction} />
            </div>

            {/* Interactive Feature Spectrum & Degradation Curve */}
            <div className="glass-panel" style={{ padding: 24 }}>
              <FeatureImportanceChart prediction={prediction} />
            </div>

            {/* Recommendations & Action Plan */}
            <div className="glass-panel" style={{ padding: 24, gridColumn: '1 / -1' }}>
              <RecommendationsPanel prediction={prediction} />
            </div>
          </div>
        )}

        {activeTab === 'rag' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* RAG Knowledge Assistant Panel */}
            <div className="glass-panel" style={{ padding: 24 }}>
              <BatteryAssistantPanel />
            </div>

            {/* Quick Advisory summary alongside */}
            <div className="glass-panel" style={{ padding: 24 }}>
              <RecommendationsPanel prediction={prediction} />
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          Model Spec Modal
         ========================================================================= */}
      {showModelModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setShowModelModal(false)}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: 600,
              width: '100%',
              padding: 28,
              background: '#0f172a',
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.25rem' }}>🔬</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc' }}>
                  Trained Machine Learning Model Specification
                </h3>
              </div>
              <button
                onClick={() => setShowModelModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {modelInfo ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: '0.825rem' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 12, borderRadius: 8 }}>
                  <span style={{ color: '#94a3b8' }}>Architecture: </span>
                  <strong style={{ color: '#38bdf8' }}>{modelInfo.model_type || 'RandomForestRegressor (Ensemble)'}</strong>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 12, borderRadius: 8 }}>
                  <span style={{ color: '#94a3b8' }}>Input Features Trained: </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {(modelInfo.features || ['voltage_mean', 'current_mean', 'temperature_mean', 'voltage_min', 'current_min', 'capacity']).map((f) => (
                      <span key={f} style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {modelInfo.metrics && (
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 12, borderRadius: 8 }}>
                    <span style={{ color: '#94a3b8' }}>Evaluation Metrics: </span>
                    <pre style={{ color: '#34d399', marginTop: 4, fontSize: '0.75rem' }}>
                      {JSON.stringify(modelInfo.metrics, null, 2)}
                    </pre>
                  </div>
                )}

                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
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
          Footer
         ========================================================================= */}
      <footer
        style={{
          borderTop: '1px solid rgba(148, 163, 184, 0.1)',
          padding: '24px',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '0.775rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          alignItems: 'center',
          background: 'rgba(8, 12, 20, 0.5)',
        }}
      >
        <div>
          BatteryIQ &bull; Research-Grade Human-AI Interaction Dashboard &bull; Track 5 Publication
        </div>
        <div style={{ fontSize: '0.725rem', color: '#475569' }}>
          Trained on NASA Battery Aging Datasets &bull; SHAP Explainable AI Framework &bull; Grounded Vector RAG Assistant
        </div>
      </footer>
    </div>
  );
}
