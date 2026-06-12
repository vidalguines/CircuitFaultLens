import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const COLOURS = ['#22c55e', '#22c55e', '#f59e0b', '#f59e0b', '#64748b'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      fontFamily: 'var(--mono)',
      fontSize: '12px',
      padding: '8px 12px',
    }}>
      <div style={{ color: 'var(--text)', marginBottom: 4 }}>{d.fullName}</div>
      <div style={{ color: payload[0].fill }}>{(d.posterior * 100).toFixed(1)}%</div>
    </div>
  );
};

export default function PosteriorChart({ hypotheses }) {
  const data = hypotheses.map(h => ({
    name: h.fault_id.replace(/_/g, ' ').substring(0, 12),
    fullName: h.description,
    posterior: h.posterior,
  }));

  return (
    <div style={{ height: '180px', width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: 'var(--text-dim)', fontFamily: 'var(--mono)', fontSize: 10 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={v => `${(v * 100).toFixed(0)}%`}
            tick={{ fill: 'var(--text-dim)', fontFamily: 'var(--mono)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="posterior" radius={[3, 3, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLOURS[i] || '#64748b'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
