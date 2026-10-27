import React, { useState } from 'react';

export default function ShapVisualization({ prediction }) {
  const [showAll, setShowAll] = useState(false);

  if (!prediction) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', minHeight: 280, textAlign: 'center', padding: 20 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: 12 }}>
          🧠
        </div>
        <h4 style={{ fontSize: '1rem', color: '#f8fafc', marginBottom: 6 }}>
          SHAP Explainable AI Ready
        </h4>
        <p style={{ fontSize: '0.825rem', color: '#94a3b8', maxWidth: 360, lineHeight: 1.5 }}>
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
            <span style={{ fontSize: '1.2rem' }}>🔬</span>
            <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', margin: 0 }}>
              SHAP Attribution & Feature Impact
            </h3>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: 3 }}>
            Local attribution showing how each parameter pushes predicted cycles up (+) or down (-).
          </p>
        </div>

        {rawContributors.length > 6 && (
          <button
            onClick={() => setShowAll(!showAll)}
            style={{
              background: 'rgba(148, 163, 184, 0.1)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: 6,
              color: '#38bdf8',
              fontSize: '0.725rem',
              fontWeight: 600,
              padding: '4px 10px',
              cursor: 'pointer',
            }}
          >
            {showAll ? 'Show Top 6' : `Show All (${rawContributors.length})`}
          </button>
        )}
      </div>

      {/* Narrative AI Explanation Box */}
      {explanation?.text && (
        <div
          style={{
            background: 'rgba(56, 189, 248, 0.06)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: 10,
            padding: '12px 14px',
            fontSize: '0.825rem',
            lineHeight: 1.55,
            color: '#cbd5e1',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: '#38bdf8', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
          const color = isPositive ? '#10b981' : '#f43f5e';
          const bgGlow = isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)';

          return (
            <div
              key={feature}
              style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                borderRadius: 8,
                padding: '8px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f1f5f9' }}>
                  {formattedName}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    color: color,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: bgGlow,
                  }}
                >
                  {isPositive ? '+' : ''}{(importance * 100).toFixed(1)}%
                </span>
              </div>

              {/* Relative impact progress bar */}
              <div
                style={{
                  height: 6,
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 3,
                  overflow: 'hidden',
                  display: 'flex',
                }}
              >
                <div
                  style={{
                    width: `${pctWidth}%`,
                    background: color,
                    borderRadius: 3,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>

              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                {isPositive
                  ? 'Favorable state — pushes predicted battery lifetime higher'
                  : 'Degradation driver — penalizes predicted lifetime cycles'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Guide footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.725rem', color: '#64748b', borderTop: '1px solid rgba(148, 163, 184, 0.1)', paddingTop: 10 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} /> Green: Extends Lifespan
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f43f5e' }} /> Red: Accelerates Aging
        </span>
      </div>
    </div>
  );
}
