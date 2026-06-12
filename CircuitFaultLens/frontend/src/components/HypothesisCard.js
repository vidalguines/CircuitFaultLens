import React from 'react';

const BAND_CONFIG = {
  HIGH:     { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.25)' },
  MODERATE: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
  LOW:      { color: '#f59e0b', bg: 'rgba(245,158,11,0.05)', border: 'rgba(245,158,11,0.15)' },
  UNLIKELY: { color: '#475569', bg: 'rgba(71,85,105,0.05)',  border: 'rgba(71,85,105,0.15)' },
};

export default function HypothesisCard({ hypothesis, rank }) {
  const cfg = BAND_CONFIG[hypothesis.confidence_band] || BAND_CONFIG.UNLIKELY;
  const pct = (hypothesis.posterior * 100).toFixed(1);
  const barWidth = `${Math.min(hypothesis.posterior * 100, 100)}%`;

  return (
    <div style={{
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: 'var(--radius)',
      marginBottom: '10px',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* confidence bar */}
      <div style={{
        background: `${cfg.color}22`,
        height: '2px',
        width: barWidth,
        transition: 'width 0.5s ease',
      }} />

      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <span style={{
            background: cfg.color,
            borderRadius: '3px',
            color: '#000',
            fontFamily: 'var(--mono)',
            fontSize: '11px',
            fontWeight: 700,
            minWidth: '22px',
            padding: '2px 6px',
            textAlign: 'center',
          }}>
            {rank}
          </span>

          <div style={{ flex: 1 }}>
            <div style={{
              color: 'var(--text)',
              fontWeight: 500,
              marginBottom: '4px',
            }}>
              {hypothesis.description}
            </div>
            <div style={{
              color: 'var(--text-dim)',
              fontFamily: 'var(--mono)',
              fontSize: '11px',
            }}>
              {hypothesis.fault_id}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{
              color: cfg.color,
              fontFamily: 'var(--mono)',
              fontSize: '20px',
              fontWeight: 600,
              lineHeight: 1,
            }}>
              {pct}%
            </div>
            <div style={{
              color: cfg.color,
              fontFamily: 'var(--mono)',
              fontSize: '10px',
              opacity: 0.8,
              textTransform: 'uppercase',
            }}>
              {hypothesis.confidence_band}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
