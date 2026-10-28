import React, { useState } from 'react';
import { queryRagAssistant } from '../services/apiService';

const PROMPT_CATEGORIES = [
  {
    category: 'Thermal & Safety',
    questions: [
      'Why does my battery heat while charging?',
      'What does battery swelling mean?',
    ],
  },
  {
    category: 'Degradation & Lifespan',
    questions: [
      'How can I improve lithium-ion battery lifespan?',
      'How does internal resistance correlate with capacity loss?',
    ],
  },
  {
    category: 'Voltage & Anomaly Diagnosis',
    questions: [
      'What should I check if voltage drops suddenly?',
      'What causes rapid capacity fade in cold temperatures?',
    ],
  },
];

export default function BatteryAssistantPanel() {
  const [query, setQuery] = useState(PROMPT_CATEGORIES[0].questions[0]);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleAsk = async (textToAsk) => {
    const q = (textToAsk || query || '').trim();
    if (!q) {
      setError('Please provide a question for the battery knowledge base.');
      return;
    }

    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      const result = await queryRagAssistant(q, 3, 'auto');
      setResponse(result);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Battery assistant request failed. Ensure the Flask backend is active or check your connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!response?.answer) return;
    navigator.clipboard.writeText(response.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.25rem' }}>🤖</span>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0, fontWeight: 800 }}>
              Retrieval-Augmented Diagnostic Assistant (RAG)
            </h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginTop: 4 }}>
            Query the empirical battery safety and electro-chemical failure repository with citation grounding.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: '0.725rem',
              fontWeight: 700,
              color: 'var(--accent-emerald)',
              background: 'rgba(5, 150, 105, 0.12)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(5, 150, 105, 0.35)',
              padding: '5px 12px',
              borderRadius: 20,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: 'var(--glass-specular-inset)',
            }}
          >
            <span className="pulse-dot online" /> Grounded Retrieval Active
          </span>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div>
        <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 10 }}>
          💡 Domain Research Queries
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PROMPT_CATEGORIES.flatMap((c) => c.questions).map((q) => {
            const isSelected = query === q;
            return (
              <button
                key={q}
                onClick={() => {
                  setQuery(q);
                  handleAsk(q);
                }}
                className={`scenario-btn ${isSelected ? 'active' : ''}`}
                style={{
                  borderRadius: 20,
                  padding: '6px 14px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {q}
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Form with Glass Styling */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          placeholder="Ask a technical battery question (e.g., 'What happens if electrolyte evaporates?')..."
          className="custom-input"
          style={{ flex: 1, minWidth: 260, padding: '13px 18px', fontSize: '0.9rem' }}
          disabled={loading}
        />
        <button
          onClick={() => handleAsk()}
          disabled={loading}
          className="btn-primary"
          style={{ padding: '13px 24px', minWidth: 150 }}
        >
          {loading ? (
            <>
              <span className="pulse-dot busy" /> Retrieving...
            </>
          ) : (
            <>
              <span>🔍</span> Consult RAG
            </>
          )}
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div
          className="glass-nested-card"
          style={{
            background: 'rgba(225, 29, 72, 0.12)',
            borderColor: 'rgba(225, 29, 72, 0.35)',
            padding: '12px 16px',
            color: 'var(--accent-rose)',
            fontSize: '0.825rem',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Grounded Response */}
      {response && (
        <div
          className="glass-nested-card"
          style={{
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Answer Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border-subtle)', paddingBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.15rem' }}>💬</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Synthesized Answer
              </span>
              {response.provider && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: 'var(--accent-indigo)',
                    background: 'rgba(79, 70, 229, 0.12)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(79, 70, 229, 0.3)',
                    padding: '2px 8px',
                    borderRadius: 6,
                  }}
                >
                  Engine: {response.provider}
                </span>
              )}
            </div>

            <button
              onClick={copyToClipboard}
              className="btn-glass-secondary"
              style={{ padding: '4px 10px', fontSize: '0.725rem' }}
            >
              {copied ? '✓ Copied' : '📋 Copy Answer'}
            </button>
          </div>

          {/* Answer Text */}
          <div style={{ fontSize: '0.925rem', lineHeight: 1.7, color: 'var(--text-main)' }}>
            {response.answer}
          </div>

          {/* Retrieved Context Cards */}
          {response.retrieved_documents?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                📚 Retrieved Knowledge Chunks ({response.retrieved_documents.length})
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                {response.retrieved_documents.map((doc, idx) => (
                  <div
                    key={doc.id || idx}
                    className="glass-nested-card"
                    style={{
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {doc.topic}
                      </span>
                      <span
                        style={{
                          fontSize: '0.675rem',
                          fontWeight: 700,
                          color: doc.severity === 'CRITICAL' ? 'var(--accent-rose)' : doc.severity === 'HIGH' ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                          background: 'var(--bg-card-glass)',
                          backdropFilter: 'blur(6px)',
                          border: `1px solid ${doc.severity === 'CRITICAL' ? 'rgba(225,29,72,0.35)' : doc.severity === 'HIGH' ? 'rgba(217,119,6,0.35)' : 'rgba(5,150,105,0.35)'}`,
                          padding: '2px 8px',
                          borderRadius: 6,
                        }}
                      >
                        {doc.severity}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {doc.recommendation}
                    </div>

                    {doc.score !== undefined && (
                      <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border-subtle)', paddingTop: 6 }}>
                        <span>Relevance Match:</span>
                        <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>{(doc.score * 100).toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
