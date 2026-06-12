import React from 'react';
import { FlaskConical, Zap } from 'lucide-react';

export default function TestCard({ test, index }) {
  const gainPct = Math.min(test.information_gain * 200, 100);

  return (
    <div style={{
      background: 'var(--bg3)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      marginBottom: '8px',
      padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{
          alignItems: 'center',
          background: 'rgba(123,97,255,0.15)',
          border: '1px solid rgba(123,97,255,0.3)',
          borderRadius: '4px',
          color: 'var(--accent2)',
          display: 'flex',
          height: '32px',
          justifyContent: 'center',
          minWidth: '32px',
        }}>
          <FlaskConical size={14} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ color: 'var(--text)', fontWeight: 500, marginBottom: '6px' }}>
            {test.name}
          </div>

          {/* info gain bar */}
          <div style={{ marginBottom: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ color: 'var(--text-dim)', fontSize: '11px', fontFamily: 'var(--mono)' }}>
                Information Gain
              </span>
              <span style={{ color: 'var(--accent2)', fontFamily: 'var(--mono)', fontSize: '11px' }}>
                {test.information_gain.toFixed(4)}
              </span>
            </div>
            <div style={{ background: 'var(--bg2)', borderRadius: '2px', height: '4px', overflow: 'hidden' }}>
              <div style={{
                background: 'var(--accent2)',
                height: '100%',
                width: `${gainPct}%`,
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-dim)', fontFamily: 'var(--mono)', fontSize: '11px' }}>
              Cost: {Array(test.cost_units).fill(null).map((_, i) => (
                <Zap key={i} size={10} style={{ color: 'var(--warn)', display: 'inline', marginLeft: '1px' }} />
              ))}
            </span>
            <span style={{ color: 'var(--text-dim)', fontFamily: 'var(--mono)', fontSize: '11px' }}>
              Targets: {test.target_faults.join(', ')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
