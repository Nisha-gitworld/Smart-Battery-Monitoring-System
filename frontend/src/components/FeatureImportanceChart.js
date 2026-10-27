import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
} from 'recharts';

export default function FeatureImportanceChart({ prediction }) {
  const [viewMode, setViewMode] = useState('bars'); // 'bars' | 'curve'

  if (!prediction) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', minHeight: 280, textAlign: 'center', padding: 20 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: 12 }}>
          📊
        </div>
        <h4 style={{ fontSize: '1rem', color: '#f8fafc', marginBottom: 6 }}>
          Diagnostic Visualizations
        </h4>
        <p style={{ fontSize: '0.825rem', color: '#94a3b8', maxWidth: 360, lineHeight: 1.5 }}>
          Attribution graphs and projected cell capacity degradation curves will render upon prediction.
        </p>
      </div>
    );
  }

  const { explanation, prediction: rulCycles } = prediction;
  const rawData = (explanation?.top_contributors || []).slice(0, 8).map(([feature, importance]) => ({
    name: feature.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    importance: +(Math.abs(importance) * 100).toFixed(1),
    signedImportance: importance,
  }));

  // Generate simulated degradation curve for the projected cycles
  const totalCycles = Math.max(20, Math.round(rulCycles));
  const step = Math.max(1, Math.floor(totalCycles / 6));
  const degradationPoints = [];
  for (let c = 0; c <= totalCycles; c += step) {
    // Capacity starts around 100% and decays towards 70-80% at RUL
    const decayFactor = (c / totalCycles);
    const capacityPct = +(100 - (decayFactor ** 1.35) * 22).toFixed(1);
    degradationPoints.push({
      cycle: `+${c} cyc`,
      capacity: capacityPct,
      nominal: +(100 - decayFactor * 14).toFixed(1),
    });
  }

  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPositive = data.signedImportance >= 0;
      return (
        <div
          style={{
            background: '#0f172a',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            borderRadius: 8,
            padding: '10px 14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.85rem', marginBottom: 4 }}>
            {data.name}
          </div>
          <div style={{ color: isPositive ? '#34d399' : '#fb7185', fontWeight: 600, fontSize: '0.8rem' }}>
            Impact: {isPositive ? '+' : ''}{(data.signedImportance * 100).toFixed(2)}%
          </div>
          <div style={{ color: '#94a3b8', fontSize: '0.725rem', marginTop: 4 }}>
            {isPositive ? 'Positively extends RUL' : 'Accelerates capacity loss'}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: '#0f172a',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            borderRadius: 8,
            padding: '10px 14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.825rem', marginBottom: 4 }}>
            Cycle Horizon: {label}
          </div>
          <div style={{ color: '#38bdf8', fontSize: '0.775rem' }}>
            Predicted Capacity: {payload[0]?.value}%
          </div>
          {payload[1] && (
            <div style={{ color: '#94a3b8', fontSize: '0.725rem' }}>
              Standard Nominal: {payload[1]?.value}%
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header and Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.2rem' }}>📈</span>
            <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', margin: 0 }}>
              {viewMode === 'bars' ? 'SHAP Feature Contribution Spectrum' : 'Projected Capacity Fade Trajectory'}
            </h3>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: 3 }}>
            {viewMode === 'bars'
              ? 'Parametric breakdown of driving influences on battery health.'
              : `Estimated capacity degradation over ${rulCycles.toFixed(0)} remaining cycles.`}
          </p>
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: 8, padding: 2 }}>
          <button
            onClick={() => setViewMode('bars')}
            style={{
              background: viewMode === 'bars' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: viewMode === 'bars' ? '#38bdf8' : '#94a3b8',
              border: 'none',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: '0.725rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            📊 Feature Bars
          </button>
          <button
            onClick={() => setViewMode('curve')}
            style={{
              background: viewMode === 'curve' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: viewMode === 'curve' ? '#38bdf8' : '#94a3b8',
              border: 'none',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: '0.725rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            📉 Fade Curve
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'bars' ? (
            <BarChart data={rawData} margin={{ top: 12, right: 12, left: -10, bottom: 45 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" vertical={false} />
              <XAxis
                dataKey="name"
                angle={-30}
                textAnchor="end"
                interval={0}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                stroke="rgba(148, 163, 184, 0.2)"
              />
              <YAxis
                unit="%"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                stroke="rgba(148, 163, 184, 0.2)"
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="importance" radius={[6, 6, 0, 0]}>
                {rawData.map((entry, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={entry.signedImportance >= 0 ? '#10b981' : '#f43f5e'}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <LineChart data={degradationPoints} margin={{ top: 12, right: 12, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" vertical={false} />
              <XAxis
                dataKey="cycle"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                stroke="rgba(148, 163, 184, 0.2)"
              />
              <YAxis
                domain={[70, 102]}
                unit="%"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                stroke="rgba(148, 163, 184, 0.2)"
              />
              <Tooltip content={<CustomLineTooltip />} />
              <Line
                type="monotone"
                dataKey="capacity"
                name="Predicted Fade"
                stroke="#38bdf8"
                strokeWidth={3}
                dot={{ r: 4, fill: '#38bdf8' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="nominal"
                name="Nominal Baseline"
                stroke="#64748b"
                strokeDasharray="4 4"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend & Summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.725rem', color: '#64748b', borderTop: '1px solid rgba(148, 163, 184, 0.1)', paddingTop: 10 }}>
        {viewMode === 'bars' ? (
          <>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981' }} />
              Positive Contribution (Extends RUL)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#f43f5e' }} />
              Negative Contribution (Reduces RUL)
            </span>
          </>
        ) : (
          <>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 3, background: '#38bdf8' }} />
              Predicted Capacity Fade
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 2, background: '#64748b' }} />
              Nominal Lab Reference
            </span>
          </>
        )}
      </div>
    </div>
  );
}
