const BASE = process.env.REACT_APP_API_URL || '/api/v1';

export async function diagnose(payload) {
  const res = await fetch(`${BASE}/diagnose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchSymptoms() {
  const res = await fetch(`${BASE}/symptoms`);
  if (!res.ok) throw new Error('Failed to fetch symptoms');
  return res.json();
}

export async function fetchFaults() {
  const res = await fetch(`${BASE}/faults`);
  if (!res.ok) throw new Error('Failed to fetch faults');
  return res.json();
}

export async function fetchHealth() {
  const res = await fetch(`${BASE}/health`);
  if (!res.ok) throw new Error('API offline');
  return res.json();
}
