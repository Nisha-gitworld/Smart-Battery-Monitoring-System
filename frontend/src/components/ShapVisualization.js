import React, { useState } from 'react';

export default function ShapVisualization({ prediction }) {
  const [showAll, setShowAll] = useState(false);

  if (!prediction) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', minHeight: 280, textAlign: 'center', padding: 20 }}>
        <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(2, 132, 199, 0.12)', backdropFilter: 'blur(10px)', border: '1px solid rgba(2, 132, 199, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', marginBottom: 12, boxShadow: '0 0 20px rgba(2, 132, 199, 0.15)' }}>
          🧠
        </div>
        <h4 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: 6, fontWeight: 700 }}>
          SHAP Explainable AI Ready
        </h4>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', maxWidth: 360, lineHeight: 1.5 }}>
          Execute a prediction to inspect the local Shapley values decomposing feature influences on remaining useful life.
        </p>
      </div>
    );
  }

  const { explanation } = prediction;
  const rawContributors = explanation?.top_contributors || [];
  const contributors = showAll ? rawContributors : rawContributors.slice(0, 6);

  // Find max absolute importance for relative bar width
  const maxAbs = Math.max(...rawContributors.map(([, imp]) => Math.abs(imp)), 0.001);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.25rem' }}>🔬</span>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0, fontWeight: 800 }}>
              SHAP Attribution & Feature Impact
            </h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginTop: 4 }}>
            Local attribution showing how each parameter pushes predicted cycles up (+) or down (-).
          </p>
        </div>

        {rawContributors.length > 6 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="btn-glass-secondary"
            style={{ padding: '4px 10px', fontSize: '0.725rem' }}
          >
            {showAll ? 'Show Top 6' : `Show All (${rawContributors.length})`}
          </button>
        )}
      </div>

      {/* Narrative AI Explanation Box */}
      {explanation?.text && (
        <div
          className="glass-nested-card"
          style={{
            background: 'rgba(2, 132, 199, 0.08)',
            borderColor: 'rgba(2, 132, 199, 0.3)',
            borderTopColor: 'var(--glass-border-specular)',
            padding: '14px 16px',
            fontSize: '0.835rem',
            lineHeight: 1.6,
            color: 'var(--text-main)',
            boxShadow: 'var(--glass-specular-inset)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: 'var(--accent-blue)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <span>💡</span> Human-Interpretable AI Summary
          </div>
          {explanation.text}
        </div>
      )}

      {/* SHAP Force Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {contributors.map(([feature, importance]) => {
          const isPositive = importance >= 0;
          const formattedName = feature.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          const pctWidth = Math.min(100, Math.round((Math.abs(importance) / maxAbs) * 100));
          const color = isPositive ? '#059669' : '#e11d48';
          const bgGlow = isPositive ? 'rgba(5, 150, 105, 0.12)' : 'rgba(225, 29, 72, 0.12)';
          const barGradient = isPositive
            ? 'linear-gradient(90deg, #059669 0%, #10b981 100%)'
            : 'linear-gradient(90deg, #e11d48 0%, #f43f5e 100%)';

          return (
            <div
              key={feature}
              className="glass-nested-card"
              style={{
                padding: '10px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 7,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {formattedName}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    color: color,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: bgGlow,
                    border: `1px solid ${isPositive ? 'rgba(5, 150, 105, 0.35)' : 'rgba(225, 29, 72, 0.35)'}`,
                  }}
                >
                  {isPositive ? '+' : ''}{(importance * 100).toFixed(1)}%
                </span>
              </div>

              {/* Relative impact progress bar */}
              <div
                style={{
                  height: 7,
                  width: '100%',
                  background: 'var(--bg-nested-glass)',
                  borderRadius: 4,
                  overflow: 'hidden',
                  display: 'flex',
                  border: '1px solid var(--glass-border-subtle)',
                }}
              >
                <div
                  style={{
                    width: `${pctWidth}%`,
                    background: barGradient,
                    borderRadius: 4,
                    transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </div>

              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                {isPositive
                  ? 'Favorable state — pushes predicted battery lifetime higher'
                  : 'Degradation driver — penalizes predicted lifetime cycles'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Guide footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.725rem', color: 'var(--text-muted)', borderTop: '1px solid var(--glass-border-subtle)', paddingTop: 10 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669' }} /> Green: Extends Lifespan
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e11d48' }} /> Red: Accelerates Aging
        </span>
      </div>
    </div>
  );
}
