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
        <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(2, 132, 199, 0.12)', backdropFilter: 'blur(10px)', border: '1px solid rgba(2, 132, 199, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', marginBottom: 12, boxShadow: '0 0 20px rgba(2, 132, 199, 0.15)' }}>
          📊
        </div>
        <h4 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: 6, fontWeight: 700 }}>
          Diagnostic Visualizations Ready
        </h4>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', maxWidth: 360, lineHeight: 1.5 }}>
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
            background: 'var(--modal-bg)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            border: '1px solid var(--glass-border)',
            borderTop: '1px solid var(--glass-border-specular)',
            borderRadius: 12,
            padding: '12px 16px',
            boxShadow: 'var(--glass-shadow)',
          }}
        >
          <div style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.85rem', marginBottom: 4 }}>
            {data.name}
          </div>
          <div style={{ color: isPositive ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 700, fontSize: '0.825rem' }}>
            Impact: {isPositive ? '+' : ''}{(data.signedImportance * 100).toFixed(2)}%
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.725rem', marginTop: 4 }}>
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
            background: 'var(--modal-bg)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            border: '1px solid var(--glass-border)',
            borderTop: '1px solid var(--glass-border-specular)',
            borderRadius: 12,
            padding: '12px 16px',
            boxShadow: 'var(--glass-shadow)',
          }}
        >
          <div style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.85rem', marginBottom: 4 }}>
            Cycle Horizon: {label}
          </div>
          <div style={{ color: 'var(--accent-blue)', fontSize: '0.8rem', fontWeight: 600 }}>
            Predicted Capacity: {payload[0]?.value}%
          </div>
          {payload[1] && (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: 2 }}>
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
            <span style={{ fontSize: '1.25rem' }}>📈</span>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0, fontWeight: 800 }}>
              {viewMode === 'bars' ? 'SHAP Feature Contribution Spectrum' : 'Projected Capacity Fade Trajectory'}
            </h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginTop: 4 }}>
            {viewMode === 'bars'
              ? 'Parametric breakdown of driving influences on battery health.'
              : `Estimated capacity degradation over ${rulCycles.toFixed(0)} remaining cycles.`}
          </p>
        </div>

        {/* View Toggle with Frosted Glass Pill */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-nested-glass)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--glass-border-subtle)',
            borderRadius: 10,
            padding: 3,
            gap: 2,
          }}
        >
          <button
            onClick={() => setViewMode('bars')}
            style={{
              background: viewMode === 'bars' ? 'rgba(2, 132, 199, 0.16)' : 'transparent',
              color: viewMode === 'bars' ? 'var(--accent-blue)' : 'var(--text-secondary)',
              border: viewMode === 'bars' ? '1px solid var(--accent-blue)' : '1px solid transparent',
              borderRadius: 7,
              padding: '5px 12px',
              fontSize: '0.725rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            📊 Feature Bars
          </button>
          <button
            onClick={() => setViewMode('curve')}
            style={{
              background: viewMode === 'curve' ? 'rgba(2, 132, 199, 0.16)' : 'transparent',
              color: viewMode === 'curve' ? 'var(--accent-blue)' : 'var(--text-secondary)',
              border: viewMode === 'curve' ? '1px solid var(--accent-blue)' : '1px solid transparent',
              borderRadius: 7,
              padding: '5px 12px',
              fontSize: '0.725rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
              <XAxis
                dataKey="name"
                angle={-30}
                textAnchor="end"
                interval={0}
                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                stroke="rgba(148, 163, 184, 0.25)"
              />
              <YAxis
                unit="%"
                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                stroke="rgba(148, 163, 184, 0.25)"
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="importance" radius={[6, 6, 0, 0]}>
                {rawData.map((entry, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={entry.signedImportance >= 0 ? '#059669' : '#e11d48'}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <LineChart data={degradationPoints} margin={{ top: 12, right: 12, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
              <XAxis
                dataKey="cycle"
                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                stroke="rgba(148, 163, 184, 0.25)"
              />
              <YAxis
                domain={[70, 102]}
                unit="%"
                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                stroke="rgba(148, 163, 184, 0.25)"
              />
              <Tooltip content={<CustomLineTooltip />} />
              <Line
                type="monotone"
                dataKey="capacity"
                name="Predicted Fade"
                stroke="#0284c7"
                strokeWidth={3}
                dot={{ r: 4, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="nominal"
                name="Nominal Baseline"
                stroke="#94a3b8"
                strokeDasharray="4 4"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend & Summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.725rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--glass-border-subtle)', paddingTop: 10 }}>
        {viewMode === 'bars' ? (
          <>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: '#059669' }} />
              Positive Contribution (Extends RUL)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: '#e11d48' }} />
              Negative Contribution (Reduces RUL)
            </span>
          </>
        ) : (
          <>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 3, background: '#0284c7', borderRadius: 2 }} />
              Predicted Capacity Fade
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 2, background: '#94a3b8', borderRadius: 2 }} />
              Nominal Lab Reference
            </span>
          </>
        )}
      </div>
    </div>
  );
}
