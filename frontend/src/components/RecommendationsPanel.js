import React, { useState } from 'react';

const PRIORITY_THEME = {
  CRITICAL: {
    label: 'Critical Immediate Action',
    badgeClass: 'critical',
    color: '#e11d48',
    borderColor: 'rgba(225, 29, 72, 0.45)',
    borderTopColor: 'rgba(255, 255, 255, 0.6)',
    bg: 'rgba(225, 29, 72, 0.08)',
    glow: '0 0 16px rgba(225, 29, 72, 0.15)',
    icon: '🚨',
  },
  HIGH: {
    label: 'High Priority',
    badgeClass: 'warning',
    color: '#d97706',
    borderColor: 'rgba(217, 119, 6, 0.45)',
    borderTopColor: 'rgba(255, 255, 255, 0.6)',
    bg: 'rgba(217, 119, 6, 0.08)',
    glow: '0 0 16px rgba(217, 119, 6, 0.15)',
    icon: '⚠️',
  },
  MEDIUM: {
    label: 'Moderate Operational',
    badgeClass: 'moderate',
    color: '#0284c7',
    borderColor: 'rgba(2, 132, 199, 0.45)',
    borderTopColor: 'rgba(255, 255, 255, 0.6)',
    bg: 'rgba(2, 132, 199, 0.08)',
    glow: '0 0 16px rgba(2, 132, 199, 0.15)',
    icon: '🔧',
  },
  OPERATIONAL: {
    label: 'Operational Protocol',
    badgeClass: 'moderate',
    color: '#4f46e5',
    borderColor: 'rgba(79, 70, 229, 0.45)',
    borderTopColor: 'rgba(255, 255, 255, 0.6)',
    bg: 'rgba(79, 70, 229, 0.08)',
    glow: '0 0 16px rgba(79, 70, 229, 0.15)',
    icon: '⚙️',
  },
  PREVENTIVE: {
    label: 'Preventive Best Practice',
    badgeClass: 'healthy',
    color: '#059669',
    borderColor: 'rgba(5, 150, 105, 0.45)',
    borderTopColor: 'rgba(255, 255, 255, 0.6)',
    bg: 'rgba(5, 150, 105, 0.08)',
    glow: '0 0 16px rgba(5, 150, 105, 0.15)',
    icon: '🛡️',
  },
};

export default function RecommendationsPanel({ prediction }) {
  const [completedActions, setCompletedActions] = useState({});
  const [filterPriority, setFilterPriority] = useState('ALL');

  if (!prediction) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', minHeight: 280, textAlign: 'center', padding: 20 }}>
        <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(5, 150, 105, 0.12)', backdropFilter: 'blur(10px)', border: '1px solid rgba(5, 150, 105, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', marginBottom: 12, boxShadow: '0 0 20px rgba(5, 150, 105, 0.15)' }}>
          🛡️
        </div>
        <h4 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: 6, fontWeight: 700 }}>
          Actionable Advisory System
        </h4>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', maxWidth: 360, lineHeight: 1.5 }}>
          Engineering recommendations tailored to detected thermal and degradation conditions will appear here.
        </p>
      </div>
    );
  }

  const { recommendations = [] } = prediction;

  const toggleAction = (idx) => {
    setCompletedActions((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const exportDiagnosticReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      prediction: prediction.prediction,
      health_status: prediction.health_status,
      confidence: prediction.confidence,
      explanation_summary: prediction.explanation?.text,
      top_factors: prediction.explanation?.top_contributors,
      recommendations: prediction.recommendations,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Battery_Diagnostic_Report_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredRecs = recommendations.filter((r) => {
    if (filterPriority === 'ALL') return true;
    return r.priority === filterPriority;
  });

  const prioritiesFound = Array.from(new Set(recommendations.map((r) => r.priority)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.25rem' }}>📋</span>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0, fontWeight: 800 }}>
              AI Maintenance Advisory & Action Plan
            </h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginTop: 4 }}>
            Synthesized domain guidelines for prolonging cell health and ensuring safety.
          </p>
        </div>

        <button
          onClick={exportDiagnosticReport}
          className="btn-glass-secondary"
          style={{ padding: '6px 14px', fontSize: '0.75rem' }}
        >
          <span>📥</span> Export Report (.json)
        </button>
      </div>

      {/* Priority Filters */}
      {prioritiesFound.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            background: 'var(--bg-nested-glass)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--glass-border-subtle)',
            borderRadius: 10,
            padding: 4,
            width: 'fit-content',
          }}
        >
          <button
            onClick={() => setFilterPriority('ALL')}
            style={{
              background: filterPriority === 'ALL' ? 'rgba(2, 132, 199, 0.16)' : 'transparent',
              color: filterPriority === 'ALL' ? 'var(--accent-blue)' : 'var(--text-secondary)',
              border: filterPriority === 'ALL' ? '1px solid var(--accent-blue)' : '1px solid transparent',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: '0.725rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            All Actions ({recommendations.length})
          </button>
          {prioritiesFound.map((p) => {
            const isSelected = filterPriority === p;
            return (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                style={{
                  background: isSelected ? 'rgba(2, 132, 199, 0.16)' : 'transparent',
                  color: isSelected ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  border: isSelected ? '1px solid var(--accent-blue)' : '1px solid transparent',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: '0.725rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {p}
              </button>
            );
          })}
        </div>
      )}

      {/* Recommendations List */}
      {filteredRecs.length === 0 ? (
        <div
          className="glass-nested-card"
          style={{
            background: 'rgba(5, 150, 105, 0.1)',
            borderColor: 'rgba(5, 150, 105, 0.3)',
            borderTopColor: 'var(--glass-border-specular)',
            padding: 18,
            textAlign: 'center',
          }}
        >
          <div style={{ color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.925rem', marginBottom: 4 }}>
            ✓ Battery Cell is Operating Within Optimal Envelope
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            No critical anomalies detected. Continue routine periodic telemetry logging.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredRecs.map((rec, idx) => {
            const theme = PRIORITY_THEME[rec.priority] || PRIORITY_THEME.OPERATIONAL;
            const isDone = !!completedActions[idx];

            return (
              <div
                key={idx}
                className="glass-nested-card"
                style={{
                  background: isDone ? 'var(--bg-nested-glass)' : theme.bg,
                  borderColor: isDone ? 'var(--glass-border-subtle)' : theme.borderColor,
                  borderTopColor: isDone ? 'var(--glass-border-specular)' : theme.borderTopColor,
                  boxShadow: isDone ? 'none' : `${theme.glow}, var(--glass-specular-inset)`,
                  padding: '14px 16px',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                  transition: 'all 0.2s ease',
                  opacity: isDone ? 0.55 : 1,
                }}
              >
                {/* Interactive Checkbox */}
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => toggleAction(idx)}
                  style={{
                    marginTop: 3,
                    cursor: 'pointer',
                    width: 17,
                    height: 17,
                    accentColor: 'var(--accent-blue)',
                  }}
                  title="Mark as executed"
                />

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: '1.1rem' }}>{theme.icon}</span>
                      <span
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          color: isDone ? 'var(--text-muted)' : 'var(--text-main)',
                          textDecoration: isDone ? 'line-through' : 'none',
                        }}
                      >
                        {rec.action}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '0.675rem',
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: 6,
                        color: theme.color,
                        background: 'var(--bg-card-glass)',
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${theme.borderColor}`,
                      }}
                    >
                      {rec.priority}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <strong style={{ color: 'var(--text-main)' }}>Reason: </strong>
                    {rec.reason}
                  </div>

                  <div style={{ fontSize: '0.765rem', color: 'var(--accent-blue)' }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>Expected Impact: </strong>
                    {rec.impact}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Human-AI Teamwork Note */}
      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', borderTop: '1px solid var(--glass-border-subtle)', paddingTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>🤝</span>
        <span>Recommendations are generated dynamically by coupling SHAP feature thresholds with NASA Battery Prognostics criteria.</span>
      </div>
    </div>
  );
}
