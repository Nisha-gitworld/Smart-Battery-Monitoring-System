import React, { useState } from 'react';

const PRIORITY_THEME = {
  CRITICAL: {
    label: 'Critical Immediate Action',
    badgeClass: 'critical',
    color: '#f43f5e',
    borderColor: 'rgba(244, 63, 94, 0.35)',
    bg: 'rgba(244, 63, 94, 0.08)',
    icon: '🚨',
  },
  HIGH: {
    label: 'High Priority',
    badgeClass: 'warning',
    color: '#f59e0b',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    bg: 'rgba(245, 158, 11, 0.08)',
    icon: '⚠️',
  },
  MEDIUM: {
    label: 'Moderate Operational',
    badgeClass: 'moderate',
    color: '#38bdf8',
    borderColor: 'rgba(56, 189, 248, 0.35)',
    bg: 'rgba(56, 189, 248, 0.08)',
    icon: '🔧',
  },
  OPERATIONAL: {
    label: 'Operational Protocol',
    badgeClass: 'moderate',
    color: '#818cf8',
    borderColor: 'rgba(129, 140, 248, 0.35)',
    bg: 'rgba(129, 140, 248, 0.08)',
    icon: '⚙️',
  },
  PREVENTIVE: {
    label: 'Preventive Best Practice',
    badgeClass: 'healthy',
    color: '#10b981',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    bg: 'rgba(16, 185, 129, 0.08)',
    icon: '🛡️',
  },
};

export default function RecommendationsPanel({ prediction }) {
  const [completedActions, setCompletedActions] = useState({});
  const [filterPriority, setFilterPriority] = useState('ALL');

  if (!prediction) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', minHeight: 280, textAlign: 'center', padding: 20 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: 12 }}>
          🛡️
        </div>
        <h4 style={{ fontSize: '1rem', color: '#f8fafc', marginBottom: 6 }}>
          Actionable Advisory System
        </h4>
        <p style={{ fontSize: '0.825rem', color: '#94a3b8', maxWidth: 360, lineHeight: 1.5 }}>
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
            <span style={{ fontSize: '1.2rem' }}>📋</span>
            <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', margin: 0 }}>
              AI Maintenance Advisory & Action Plan
            </h3>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: 3 }}>
            Synthesized domain guidelines for prolonging cell health and ensuring safety.
          </p>
        </div>

        <button
          onClick={exportDiagnosticReport}
          style={{
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: 6,
            color: '#38bdf8',
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '5px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>📥</span> Export Report (.json)
        </button>
      </div>

      {/* Priority Filters */}
      {prioritiesFound.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterPriority('ALL')}
            style={{
              background: filterPriority === 'ALL' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.6)',
              color: filterPriority === 'ALL' ? '#38bdf8' : '#94a3b8',
              border: '1px solid rgba(148, 163, 184, 0.15)',
              borderRadius: 6,
              padding: '3px 9px',
              fontSize: '0.725rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            All Actions ({recommendations.length})
          </button>
          {prioritiesFound.map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              style={{
                background: filterPriority === p ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                color: filterPriority === p ? '#38bdf8' : '#94a3b8',
                border: '1px solid rgba(148, 163, 184, 0.15)',
                borderRadius: 6,
                padding: '3px 9px',
                fontSize: '0.725rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Recommendations List */}
      {filteredRecs.length === 0 ? (
        <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
          <div style={{ color: '#34d399', fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>
            ✓ Battery Cell is Operating Within Optimal Envelope
          </div>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
            No critical anomalies detected. Continue routine periodic telemetry logging.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredRecs.map((rec, idx) => {
            const theme = PRIORITY_THEME[rec.priority] || PRIORITY_THEME.OPERATIONAL;
            const isDone = !!completedActions[idx];

            return (
              <div
                key={idx}
                style={{
                  background: isDone ? 'rgba(15, 23, 42, 0.3)' : theme.bg,
                  border: `1px solid ${isDone ? 'rgba(148, 163, 184, 0.1)' : theme.borderColor}`,
                  borderRadius: 10,
                  padding: '12px 14px',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                  transition: 'all 0.2s ease',
                  opacity: isDone ? 0.6 : 1,
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
                    width: 16,
                    height: 16,
                    accentColor: '#38bdf8',
                  }}
                  title="Mark as executed"
                />

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{theme.icon}</span>
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: isDone ? '#94a3b8' : '#f8fafc',
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
                        padding: '2px 8px',
                        borderRadius: 4,
                        color: theme.color,
                        background: 'rgba(0,0,0,0.3)',
                        border: `1px solid ${theme.borderColor}`,
                      }}
                    >
                      {rec.priority}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.775rem', color: '#cbd5e1' }}>
                    <strong style={{ color: '#94a3b8' }}>Reason: </strong>
                    {rec.reason}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                    <strong style={{ color: '#94a3b8' }}>Expected Impact: </strong>
                    {rec.impact}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Human-AI Teamwork Note */}
      <div style={{ fontSize: '0.725rem', color: '#64748b', borderTop: '1px solid rgba(148, 163, 184, 0.1)', paddingTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>🤝</span>
        <span>Recommendations are generated dynamically by coupling SHAP feature thresholds with NASA Battery Prognostics criteria.</span>
      </div>
    </div>
  );
}
