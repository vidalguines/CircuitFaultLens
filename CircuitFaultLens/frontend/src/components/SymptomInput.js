import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

const QUICK_SYMPTOMS = [
  'voltage_ripple', 'voltage_drop', 'thermal_anomaly',
  'noise_hf', 'noise_lf', 'intermittent_reset',
  'efficiency_loss', 'emi_emission', 'voltage_offset',
  'load_regulation_poor',
];

const styles = {
  container: {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '20px',
  },
  label: {
    fontFamily: 'var(--mono)',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--text-dim)',
    marginBottom: '10px',
    display: 'block',
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  input: {
    flex: 1,
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text)',
    fontFamily: 'var(--mono)',
    fontSize: '13px',
    padding: '8px 12px',
    outline: 'none',
  },
  addBtn: {
    background: 'var(--accent)',
    border: 'none',
    borderRadius: 'var(--radius)',
    color: '#000',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontFamily: 'var(--mono)',
    fontSize: '13px',
    fontWeight: 600,
    padding: '8px 14px',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '14px',
  },
  chip: {
    alignItems: 'center',
    background: 'rgba(0,229,255,0.12)',
    border: '1px solid rgba(0,229,255,0.3)',
    borderRadius: '4px',
    color: 'var(--accent)',
    cursor: 'default',
    display: 'flex',
    fontFamily: 'var(--mono)',
    fontSize: '12px',
    gap: '6px',
    padding: '3px 8px',
  },
  chipX: {
    background: 'none',
    border: 'none',
    color: 'var(--accent)',
    cursor: 'pointer',
    display: 'flex',
    opacity: 0.6,
    padding: 0,
  },
  quickLabel: {
    color: 'var(--text-dim)',
    fontSize: '12px',
    marginBottom: '6px',
  },
  quickChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '5px',
  },
  quickChip: {
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    color: 'var(--text-dim)',
    cursor: 'pointer',
    fontFamily: 'var(--mono)',
    fontSize: '11px',
    padding: '3px 8px',
    transition: 'border-color 0.15s',
  },
};

export default function SymptomInput({ symptoms, onChange }) {
  const [text, setText] = useState('');

  function addSymptom(name) {
    const n = name.trim().toLowerCase().replace(/\s+/g, '_');
    if (!n || symptoms.find(s => s.name === n)) return;
    onChange([...symptoms, { name: n }]);
    setText('');
  }

  function remove(name) {
    onChange(symptoms.filter(s => s.name !== name));
  }

  function handleKey(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSymptom(text);
    }
  }

  return (
    <div style={styles.container}>
      <span style={styles.label}>Observed Symptoms</span>

      {symptoms.length > 0 && (
        <div style={styles.chips}>
          {symptoms.map(s => (
            <span key={s.name} style={styles.chip}>
              {s.name}
              <button style={styles.chipX} onClick={() => remove(s.name)}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div style={styles.inputRow}>
        <input
          style={styles.input}
          placeholder="e.g. voltage_drop or 'ripple'…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
        />
        <button style={styles.addBtn} onClick={() => addSymptom(text)}>
          <Plus size={14} /> Add
        </button>
      </div>

      <div style={styles.quickLabel}>Quick-add</div>
      <div style={styles.quickChips}>
        {QUICK_SYMPTOMS.filter(q => !symptoms.find(s => s.name === q)).map(q => (
          <button
            key={q}
            style={styles.quickChip}
            onClick={() => addSymptom(q)}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
