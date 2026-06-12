import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Cpu, FlaskConical, AlertTriangle, RefreshCw, X } from 'lucide-react';
import SymptomInput from './components/SymptomInput';
import HypothesisCard from './components/HypothesisCard';
import TestCard from './components/TestCard';
import PosteriorChart from './components/PosteriorChart';
import { diagnose, fetchHealth } from './utils/api';

const s = {
  layout: {
    display: 'grid',
    gridTemplateColumns: '340px 1fr',
    gridTemplateRows: 'auto 1fr',
    minHeight: '100vh',
    maxWidth: '1280px',
    margin: '0 auto',
  },
  header: {
    gridColumn: '1 / -1',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 24px',
    background: 'var(--bg2)',
  },
  logo: {
    color: 'var(--accent)',
    fontFamily: 'var(--mono)',
    fontSize: '16px',
    fontWeight: 600,
    letterSpacing: '0.02em',
  },
  logoSub: {
    color: 'var(--text-dim)',
    fontFamily: 'var(--mono)',
    fontSize: '11px',
    marginLeft: '4px',
  },
  statusDot: (ok) => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: ok ? '#22c55e' : '#ef4444',
    marginLeft: 'auto',
    boxShadow: ok ? '0 0 6px #22c55e88' : '0 0 6px #ef444488',
  }),
  sidebar: {
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '20px',
    overflowY: 'auto',
  },
  main: {
    overflowY: 'auto',
    padding: '20px',
  },
  sectionLabel: {
    color: 'var(--text-dim)',
    fontFamily: 'var(--mono)',
    fontSize: '10px',
    letterSpacing: '0.12em',
    marginBottom: '10px',
    textTransform: 'uppercase',
  },
  runBtn: {
    alignItems: 'center',
    background: 'var(--accent)',
    border: 'none',
    borderRadius: 'var(--radius)',
    color: '#000',
    cursor: 'pointer',
    display: 'flex',
    fontFamily: 'var(--mono)',
    fontSize: '13px',
    fontWeight: 700,
    gap: '8px',
    justifyContent: 'center',
    letterSpacing: '0.04em',
    padding: '11px',
    width: '100%',
  },
  runBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  resetBtn: {
    alignItems: 'center',
    background: 'none',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text-dim)',
    cursor: 'pointer',
    display: 'flex',
    fontFamily: 'var(--mono)',
    fontSize: '12px',
    gap: '6px',
    justifyContent: 'center',
    padding: '8px',
    width: '100%',
  },
  absentInput: {
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text)',
    fontFamily: 'var(--mono)',
    fontSize: '12px',
    outline: 'none',
    padding: '8px 10px',
    width: '100%',
  },
  errorBox: {
    alignItems: 'center',
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 'var(--radius)',
    color: '#fca5a5',
    display: 'flex',
    fontFamily: 'var(--mono)',
    fontSize: '12px',
    gap: '8px',
    padding: '10px 12px',
  },
  metaRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  metaCard: {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    flex: 1,
    minWidth: '120px',
    padding: '12px 16px',
  },
  metaValue: {
    color: 'var(--accent)',
    fontFamily: 'var(--mono)',
    fontSize: '22px',
    fontWeight: 600,
  },
  metaLabel: {
    color: 'var(--text-dim)',
    fontFamily: 'var(--mono)',
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginTop: '2px',
  },
  emptyState: {
    alignItems: 'center',
    color: 'var(--text-dim)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    justifyContent: 'center',
    minHeight: '300px',
    textAlign: 'center',
  },
  completenessBar: {
    background: 'var(--bg3)',
    borderRadius: '2px',
    height: '6px',
    overflow: 'hidden',
    width: '100%',
  },
};

export default function App() {
  const [symptoms, setSymptoms] = useState([]);
  const [absentRaw, setAbsentRaw] = useState('');
  const [alreadyRun, setAlreadyRunRaw] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiOk, setApiOk] = useState(null);
  const [completedTests, setCompletedTests] = useState([]);

  useEffect(() => {
    fetchHealth()
      .then(() => setApiOk(true))
      .catch(() => setApiOk(false));
  }, []);

  const handleDiagnose = useCallback(async () => {
    if (!symptoms.length) return;
    setLoading(true);
    setError(null);
    try {
      const absentList = absentRaw.split(',').map(s => s.trim()).filter(Boolean);
      const runList = [
        ...completedTests,
        ...alreadyRun.split(',').map(s => s.trim()).filter(Boolean),
      ];
      const data = await diagnose({
        symptoms,
        absent_symptoms: absentList,
        already_run_tests: runList,
        top_n: 5,
      });
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [symptoms, absentRaw, alreadyRun, completedTests]);

  function markTestDone(testId) {
    setCompletedTests(prev => [...new Set([...prev, testId])]);
  }

  function reset() {
    setSymptoms([]);
    setAbsentRaw('');
    setAlreadyRunRaw('');
    setResult(null);
    setError(null);
    setCompletedTests([]);
  }

  const completeness = result ? result.data_completeness : 0;

  return (
    <div style={s.layout}>
      {/* Header */}
      <header style={s.header}>
        <Cpu size={18} style={{ color: 'var(--accent)' }} />
        <span style={s.logo}>
          CircuitFaultLens
          <span style={s.logoSub}>/ Bayesian Fault Diagnosis</span>
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-dim)' }}>
            API {apiOk === null ? '…' : apiOk ? 'online' : 'offline'}
          </span>
          <div style={s.statusDot(apiOk)} />
        </div>
      </header>

      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div>
          <div style={s.sectionLabel}>Symptom Input</div>
          <SymptomInput symptoms={symptoms} onChange={setSymptoms} />
        </div>

        <div>
          <div style={s.sectionLabel}>Absent Symptoms (comma-sep)</div>
          <input
            style={s.absentInput}
            placeholder="e.g. thermal_anomaly, noise_hf"
            value={absentRaw}
            onChange={e => setAbsentRaw(e.target.value)}
          />
        </div>

        <div>
          <div style={s.sectionLabel}>Tests Already Performed (IDs)</div>
          <input
            style={s.absentInput}
            placeholder="e.g. esr_meter, thermal_scan"
            value={alreadyRun}
            onChange={e => setAlreadyRunRaw(e.target.value)}
          />
        </div>

        {error && (
          <div style={s.errorBox}>
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        <button
          style={{ ...s.runBtn, ...((!symptoms.length || loading) ? s.runBtnDisabled : {}) }}
          onClick={handleDiagnose}
          disabled={!symptoms.length || loading}
        >
          <Activity size={15} />
          {loading ? 'Analysing…' : 'Run Diagnosis'}
        </button>

        <button style={s.resetBtn} onClick={reset}>
          <RefreshCw size={13} /> Reset
        </button>
      </aside>

      {/* Main panel */}
      <main style={s.main}>
        {!result && !loading && (
          <div style={s.emptyState}>
            <Cpu size={48} style={{ color: 'var(--text-muted)' }} />
            <div style={{ color: 'var(--text-dim)', fontFamily: 'var(--mono)', fontSize: '13px' }}>
              Add symptoms and run a diagnosis
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', maxWidth: '320px' }}>
              CircuitFaultLens ranks fault hypotheses using Bayesian inference on partial data
              and recommends the most informative next test to perform.
            </div>
          </div>
        )}

        {result && (
          <>
            {/* Meta row */}
            <div style={s.metaRow}>
              <div style={s.metaCard}>
                <div style={s.metaValue}>{result.hypotheses.length}</div>
                <div style={s.metaLabel}>Hypotheses</div>
              </div>
              <div style={s.metaCard}>
                <div style={s.metaValue}>{result.symptom_count}</div>
                <div style={s.metaLabel}>Symptoms</div>
              </div>
              <div style={s.metaCard}>
                <div style={{ ...s.metaValue, color: completeness > 0.4 ? 'var(--success)' : 'var(--warn)' }}>
                  {(completeness * 100).toFixed(0)}%
                </div>
                <div style={s.metaLabel}>Data Coverage</div>
                <div style={s.completenessBar}>
                  <div style={{
                    background: completeness > 0.4 ? 'var(--success)' : 'var(--warn)',
                    height: '100%',
                    width: `${completeness * 100}%`,
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              </div>
              <div style={s.metaCard}>
                <div style={{ ...s.metaValue, color: 'var(--accent2)' }}>
                  {result.next_best_tests.length}
                </div>
                <div style={s.metaLabel}>Tests Queued</div>
              </div>
            </div>

            {/* Posterior chart */}
            <div style={s.sectionLabel}>Posterior Distribution</div>
            <div style={{
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              marginBottom: '20px',
              padding: '16px',
            }}>
              <PosteriorChart hypotheses={result.hypotheses} />
            </div>

            {/* Hypotheses */}
            <div style={s.sectionLabel}>Ranked Fault Hypotheses</div>
            {result.hypotheses.map((h, i) => (
              <HypothesisCard key={h.fault_id} hypothesis={h} rank={i + 1} />
            ))}

            {/* Next best tests */}
            <div style={{ ...s.sectionLabel, marginTop: '20px' }}>
              Next-Best Tests
              <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
                (ranked by information gain / cost)
              </span>
            </div>
            {result.next_best_tests.map((t, i) => (
              <div key={t.test_id} style={{ position: 'relative' }}>
                <TestCard test={t} index={i} />
                {!completedTests.includes(t.test_id) && (
                  <button
                    onClick={() => markTestDone(t.test_id)}
                    style={{
                      background: 'none',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      bottom: '16px',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      fontFamily: 'var(--mono)',
                      fontSize: '10px',
                      padding: '3px 8px',
                      position: 'absolute',
                      right: '14px',
                    }}
                  >
                    ✓ Mark done
                  </button>
                )}
              </div>
            ))}

            {/* Normalised symptoms */}
            <div style={{ ...s.sectionLabel, marginTop: '20px' }}>Normalised Inputs</div>
            <div style={{
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--mono)',
              fontSize: '12px',
              padding: '12px 16px',
            }}>
              {result.normalised_symptoms.map(sym => (
                <span key={sym} style={{
                  background: 'rgba(0,229,255,0.08)',
                  border: '1px solid rgba(0,229,255,0.2)',
                  borderRadius: '3px',
                  color: 'var(--accent)',
                  display: 'inline-block',
                  marginRight: '6px',
                  marginBottom: '4px',
                  padding: '2px 8px',
                }}>
                  {sym}
                </span>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
