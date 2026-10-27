import React, { useState } from 'react';
import axios from 'axios';

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
      const apiUrl = process.env.REACT_APP_API_URL || '';
      const result = await axios.post(`${apiUrl}/rag/query`, {
        query: q,
        top_k: 3,
        provider: 'auto',
      });
      setResponse(result.data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Battery assistant request failed. Ensure the Flask backend is active on port 5001.'
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.25rem' }}>🤖</span>
            <h3 style={{ fontSize: '1.15rem', color: '#f8fafc', margin: 0 }}>
              Retrieval-Augmented Diagnostic Assistant (RAG)
            </h3>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.825rem', marginTop: 3 }}>
            Query the empirical battery safety and electro-chemical failure repository with citation grounding.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: '0.725rem',
              fontWeight: 700,
              color: '#34d399',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '4px 10px',
              borderRadius: 20,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span className="pulse-dot online" /> Grounded Retrieval
          </span>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div>
        <div style={{ fontSize: '0.725rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 8 }}>
          💡 Domain Research Queries
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PROMPT_CATEGORIES.flatMap((c) => c.questions).map((q) => (
            <button
              key={q}
              onClick={() => {
                setQuery(q);
                handleAsk(q);
              }}
              style={{
                background: query === q ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.55)',
                color: query === q ? '#38bdf8' : '#cbd5e1',
                border: query === q ? '1px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.18)',
                borderRadius: 20,
                padding: '5px 12px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          placeholder="Ask a technical battery question (e.g., 'What happens if electrolyte evaporates?')..."
          className="custom-input"
          style={{ flex: 1, minWidth: 260, padding: '12px 16px', fontSize: '0.875rem' }}
          disabled={loading}
        />
        <button
          onClick={() => handleAsk()}
          disabled={loading}
          className="btn-primary"
          style={{ padding: '12px 20px', minWidth: 140 }}
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
        <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 8, padding: '10px 14px', color: '#fb7185', fontSize: '0.8rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Grounded Response */}
      {response && (
        <div style={{ background: 'rgba(10, 16, 31, 0.75)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Answer Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(148, 163, 184, 0.12)', paddingBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1rem' }}>💬</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Synthesized Answer
              </span>
              {response.provider && (
                <span style={{ fontSize: '0.7rem', color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>
                  Engine: {response.provider}
                </span>
              )}
            </div>

            <button
              onClick={copyToClipboard}
              style={{
                background: 'transparent',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: 6,
                color: copied ? '#34d399' : '#94a3b8',
                fontSize: '0.725rem',
                padding: '4px 8px',
                cursor: 'pointer',
              }}
            >
              {copied ? '✓ Copied' : '📋 Copy Answer'}
            </button>
          </div>

          {/* Answer Text */}
          <div style={{ fontSize: '0.9rem', lineHeight: 1.65, color: '#f1f5f9' }}>
            {response.answer}
          </div>

          {/* Retrieved Context Cards */}
          {response.retrieved_documents?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <div style={{ fontSize: '0.725rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                📚 Retrieved Knowledge Chunks ({response.retrieved_documents.length})
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
                {response.retrieved_documents.map((doc, idx) => (
                  <div
                    key={doc.id || idx}
                    style={{
                      background: 'rgba(15, 23, 42, 0.5)',
                      border: '1px solid rgba(148, 163, 184, 0.15)',
                      borderRadius: 8,
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
                        {doc.topic}
                      </span>
                      <span
                        style={{
                          fontSize: '0.675rem',
                          fontWeight: 700,
                          color: doc.severity === 'CRITICAL' ? '#f43f5e' : doc.severity === 'HIGH' ? '#f59e0b' : '#34d399',
                          background: 'rgba(0,0,0,0.3)',
                          padding: '2px 6px',
                          borderRadius: 4,
                        }}
                      >
                        {doc.severity}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.775rem', color: '#94a3b8', lineHeight: 1.45 }}>
                      {doc.recommendation}
                    </div>

                    {doc.score !== undefined && (
                      <div style={{ fontSize: '0.675rem', color: '#64748b', marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
                        <span>Relevance Match:</span>
                        <span style={{ color: '#38bdf8', fontWeight: 600 }}>{(doc.score * 100).toFixed(1)}%</span>
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
