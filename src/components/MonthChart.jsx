import { useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { formatCompact, formatDollars } from '../lib/money.js';

export default function MonthChart({ categoryStates }) {
  const [mode, setMode] = useState('pie');
  const data = categoryStates
    .filter((c) => (c.spent || 0) > 0)
    .map((c) => ({ name: c.name, value: c.spent, color: c.color }));

  const totalSpent = data.reduce((a, d) => a + d.value, 0);

  return (
    <div className="bg-bg-raised border border-line rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-ink-muted text-xs uppercase tracking-wider">Spent this month</div>
          <div className="tnum text-ink text-2xl font-semibold mt-0.5">{formatDollars(totalSpent)}</div>
        </div>
        <div className="flex bg-bg rounded-lg p-1 border border-line text-xs">
          <Toggle on={mode === 'pie'} onClick={() => setMode('pie')}>Pie</Toggle>
          <Toggle on={mode === 'bar'} onClick={() => setMode('bar')}>Bar</Toggle>
        </div>
      </div>
      {data.length === 0 ? (
        <div className="text-ink-muted text-sm py-10 text-center">No spending yet this month.</div>
      ) : (
        <div style={{ width: '100%', height: 260 }}>
          {mode === 'pie' ? (
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  stroke="#0f0f11"
                  strokeWidth={2}
                >
                  {data.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer>
              <BarChart data={data} layout="vertical" margin={{ left: 0, right: 24 }}>
                <CartesianGrid stroke="#26262d" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => formatCompact(v)} stroke="#9a9aa3" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="#9a9aa3" fontSize={11} width={90} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {data.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-xs min-w-0">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className="text-ink-muted truncate flex-1">{d.name}</span>
            <span className="tnum text-ink">{formatDollars(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Toggle({ on, ...props }) {
  return (
    <button
      {...props}
      className={`px-3 py-1.5 rounded-md press ${on ? 'bg-bg-elevated text-ink' : 'text-ink-muted'}`}
    />
  );
}
