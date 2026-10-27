import React, { useState } from 'react';

const SCENARIOS = [
  {
    id: 'nominal',
    name: 'Nominal / Healthy',
    badge: 'Healthy Cell',
    color: '#10b981',
    data: {
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
    },
  },
  {
    id: 'high_load',
    name: 'High Load Discharge',
    badge: 'Heavy Drain',
    color: '#38bdf8',
    data: {
      Voltage_measured: 3.52,
      Current_measured: -2.5,
      Temperature_measured: 33.5,
      Current_load: -2.3,
      Voltage_load: 3.3,
      Time: 480,
      Sense_current: -2.5,
      Battery_current: -2.5,
      Current_ratio: 0.92,
      Battery_impedance: 0.14,
      Rectified_Impedance: 0.16,
      Current_charge: 1.0,
      Voltage_charge: 4.0,
    },
  },
  {
    id: 'thermal_stress',
    name: 'Thermal Stress (48°C)',
    badge: 'Elevated Temp',
    color: '#f59e0b',
    data: {
      Voltage_measured: 3.72,
      Current_measured: -1.8,
      Temperature_measured: 48.0,
      Current_load: -1.7,
      Voltage_load: 3.42,
      Time: 360,
      Sense_current: -1.8,
      Battery_current: -1.8,
      Current_ratio: 0.94,
      Battery_impedance: 0.22,
      Rectified_Impedance: 0.25,
      Current_charge: 2.1,
      Voltage_charge: 4.25,
    },
  },
  {
    id: 'degraded',
    name: 'Severe Degradation (EOL)',
    badge: 'Critical Age',
    color: '#f43f5e',
    data: {
      Voltage_measured: 3.15,
      Current_measured: -0.7,
      Temperature_measured: 41.5,
      Current_load: -0.6,
      Voltage_load: 2.85,
      Time: 920,
      Sense_current: -0.7,
      Battery_current: -0.7,
      Current_ratio: 0.85,
      Battery_impedance: 0.38,
      Rectified_Impedance: 0.42,
      Current_charge: 0.8,
      Voltage_charge: 3.9,
    },
  },
];

const PARAMETER_META = {
  Voltage_measured: { label: 'Terminal Voltage', unit: 'V', step: 0.05, category: 'core', desc: 'Cell open-circuit terminal voltage' },
  Current_measured: { label: 'Discharge Current', unit: 'A', step: 0.1, category: 'core', desc: 'Discharge rate (negative indicates load)' },
  Temperature_measured: { label: 'Cell Temperature', unit: '°C', step: 0.5, category: 'core', desc: 'Operating cell surface temperature' },
  Voltage_load: { label: 'Load Voltage', unit: 'V', step: 0.05, category: 'load', desc: 'Voltage under active continuous load' },
  Current_load: { label: 'Load Current', unit: 'A', step: 0.1, category: 'load', desc: 'Effective measured load current' },
  Time: { label: 'Elapsed Test Time', unit: 's', step: 10, category: 'load', desc: 'Operational test cycle duration' },
  Sense_current: { label: 'Sense Current', unit: 'A', step: 0.1, category: 'load', desc: 'Sensor circuit feedback current' },
  Current_ratio: { label: 'Current Ratio', unit: '', step: 0.05, category: 'load', desc: 'Load-to-sense current efficiency' },
  Battery_current: { label: 'Battery Current', unit: 'A', step: 0.1, category: 'impedance', desc: 'Internal chemical net current flow' },
  Battery_impedance: { label: 'Internal Resistance (R_b)', unit: 'Ω', step: 0.01, category: 'impedance', desc: 'DC equivalent internal impedance' },
  Rectified_Impedance: { label: 'Rectified Impedance', unit: 'Ω', step: 0.01, category: 'impedance', desc: 'AC/Frequency adjusted cell impedance' },
  Current_charge: { label: 'Charge Current', unit: 'A', step: 0.1, category: 'impedance', desc: 'Constant current stage rating' },
  Voltage_charge: { label: 'Charge Voltage', unit: 'V', step: 0.05, category: 'impedance', desc: 'Float/cut-off charging voltage' },
};

export default function PredictionPanel({
  prediction,
  batteryData,
  setBatteryData,
  onPredict,
  loading,
}) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeScenario, setActiveScenario] = useState('nominal');

  const handleInputChange = (field, rawValue) => {
    const val = parseFloat(rawValue);
    setBatteryData((prev) => ({
      ...prev,
      [field]: isNaN(val) ? 0 : val,
    }));
  };

  const applyScenario = (scenario) => {
    setActiveScenario(scenario.id);
    setBatteryData(scenario.data);
  };

  const randomizeValues = () => {
    setActiveScenario('custom');
    setBatteryData({
      Voltage_measured: +(3.3 + Math.random() * 0.85).toFixed(2),
      Current_measured: +(-0.5 - Math.random() * 2.5).toFixed(2),
      Temperature_measured: +(20 + Math.random() * 28).toFixed(1),
      Current_load: +(-0.4 - Math.random() * 2.2).toFixed(2),
      Voltage_load: +(3.1 + Math.random() * 0.8).toFixed(2),
      Time: Math.floor(60 + Math.random() * 800),
      Sense_current: -1.0,
      Battery_current: -1.0,
      Current_ratio: +(0.8 + Math.random() * 0.15).toFixed(2),
      Battery_impedance: +(0.06 + Math.random() * 0.3).toFixed(2),
      Rectified_Impedance: +(0.07 + Math.random() * 0.32).toFixed(2),
      Current_charge: +(0.8 + Math.random() * 1.5).toFixed(1),
      Voltage_charge: +(4.0 + Math.random() * 0.25).toFixed(2),
    });
  };

  const filterFields = Object.entries(batteryData).filter(([key]) => {
    if (activeCategory === 'all') return true;
    return PARAMETER_META[key]?.category === activeCategory;
  });

  // Calculate live warnings
  const temp = batteryData.Temperature_measured;
  const volt = batteryData.Voltage_measured;
  const imp = batteryData.Battery_impedance;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title & Quick Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.25rem' }}>⚡</span>
            <h3 style={{ fontSize: '1.15rem', color: '#f8fafc', margin: 0 }}>
              Battery Health Predictor & Telemetry Input
            </h3>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.825rem', marginTop: 4 }}>
            Input measured electro-chemical parameters or test preset degradation profiles.
          </p>
        </div>

        {/* Live parameter alert badges */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {temp >= 45 && (
            <span className="status-pill critical" title="High temperature accelerates SEI growth">
              🔥 Overheating: {temp}°C
            </span>
          )}
          {volt < 3.3 && (
            <span className="status-pill warning" title="Low cell voltage approaching cutoff">
              ⚠️ Voltage Sag: {volt}V
            </span>
          )}
          {imp >= 0.25 && (
            <span className="status-pill critical" title="Elevated internal resistance detected">
              ⚡ High Impedance: {imp}Ω
            </span>
          )}
        </div>
      </div>

      {/* Preset Scenario Selector */}
      <div style={{ background: 'rgba(10, 16, 31, 0.65)', border: '1px solid rgba(148, 163, 184, 0.1)', borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            🎯 Test Profiles & Scenarios
          </span>
          <button
            onClick={randomizeValues}
            style={{
              background: 'transparent',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: 6,
              color: '#94a3b8',
              fontSize: '0.725rem',
              padding: '3px 8px',
              cursor: 'pointer',
            }}
          >
            🎲 Randomize Telemetry
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>
          {SCENARIOS.map((sc) => {
            const isSelected = activeScenario === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => applyScenario(sc)}
                className={`scenario-btn ${isSelected ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 3,
                  padding: '9px 12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.8rem', color: isSelected ? sc.color : '#e2e8f0' }}>
                    {sc.name}
                  </span>
                </div>
                <span style={{ fontSize: '0.675rem', color: '#64748b' }}>{sc.badge}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid rgba(148, 163, 184, 0.12)', paddingBottom: 8 }}>
        {[
          { id: 'all', label: 'All Parameters (13)' },
          { id: 'core', label: 'Core Volt / Amp / Temp' },
          { id: 'load', label: 'Load & Time' },
          { id: 'impedance', label: 'Impedance & Charging' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id)}
            style={{
              background: activeCategory === tab.id ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
              color: activeCategory === tab.id ? '#38bdf8' : '#94a3b8',
              border: activeCategory === tab.id ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Parameter Inputs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 12 }}>
        {filterFields.map(([field, value]) => {
          const meta = PARAMETER_META[field] || { label: field, unit: '', step: 0.1, desc: '' };
          return (
            <div
              key={field}
              style={{
                background: 'rgba(15, 23, 42, 0.45)',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                borderRadius: 8,
                padding: '9px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.725rem', fontWeight: 600, color: '#cbd5e1' }} title={meta.desc}>
                  {meta.label}
                </label>
                {meta.unit && (
                  <span style={{ fontSize: '0.675rem', color: '#64748b', fontWeight: 700 }}>
                    [{meta.unit}]
                  </span>
                )}
              </div>
              <input
                type="number"
                step={meta.step}
                value={value}
                onChange={(e) => handleInputChange(field, e.target.value)}
                disabled={loading}
                className="custom-input"
              />
            </div>
          );
        })}
      </div>

      {/* Predict Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
          ML Pipeline: Random Forest Regression + TreeExplainer SHAP
        </div>

        <button
          onClick={onPredict}
          disabled={loading}
          className="btn-primary"
          style={{ minWidth: 220 }}
        >
          {loading ? (
            <>
              <span className="pulse-dot busy" />
              Running Inference & SHAP...
            </>
          ) : (
            <>
              <span>⚡</span> Run Battery Health Diagnosis
            </>
          )}
        </button>
      </div>
    </div>
  );
}
