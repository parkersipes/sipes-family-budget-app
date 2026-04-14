import { useMemo, useState } from 'react';
import { formatDollars } from '../lib/money.js';

export default function OverflowModal({
  open,
  onClose,
  onConfirm,
  overdraftCents,
  targetCategory,
  donorCandidates,
}) {
  const [selected, setSelected] = useState([]);

  const allocatable = useMemo(() => {
    return donorCandidates
      .filter((c) => c.id !== targetCategory?.id && c.remaining > 0)
      .sort((a, b) => b.remaining - a.remaining);
  }, [donorCandidates, targetCategory]);

  // Distribute the overdraft greedily across selected donors in the order they were picked.
  const pulls = useMemo(() => {
    let left = overdraftCents;
    const out = [];
    for (const id of selected) {
      if (left <= 0) break;
      const cat = allocatable.find((c) => c.id === id);
      if (!cat) continue;
      const take = Math.min(cat.remaining, left);
      if (take > 0) out.push({ categoryId: id, amount: take });
      left -= take;
    }
    return out;
  }, [selected, allocatable, overdraftCents]);

  const pulled = pulls.reduce((a, p) => a + p.amount, 0);
  const covered = pulled >= overdraftCents;

  if (!open) return null;

  function toggle(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-bg-raised border border-line rounded-2xl p-5">
        <div className="text-ink text-lg font-semibold mb-1">Budget Overflow</div>
        <div className="text-ink-muted text-sm mb-4">
          This expense exceeds the{' '}
          <span className="text-ink font-medium">{targetCategory?.name}</span> envelope by{' '}
          <span className="text-bad tnum font-semibold">{formatDollars(overdraftCents)}</span>.
          Choose envelopes to pull from.
        </div>
        <div className="max-h-64 overflow-y-auto divide-y divide-line border border-line rounded-lg">
          {allocatable.length === 0 && (
            <div className="p-4 text-sm text-ink-muted">No other envelopes have remaining budget.</div>
          )}
          {allocatable.map((c) => {
            const on = selected.includes(c.id);
            const pull = pulls.find((p) => p.categoryId === c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggle(c.id)}
                className={`w-full flex items-center justify-between px-4 py-3 press ${on ? 'bg-bg-elevated' : ''}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: c.color }}
                  />
                  <span className="text-ink truncate">{c.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="tnum text-ink-muted text-xs">has {formatDollars(c.remaining)}</div>
                    {pull && (
                      <div className="tnum text-accent text-xs font-medium">
                        pull {formatDollars(pull.amount)}
                      </div>
                    )}
                  </div>
                  <span className={`w-5 h-5 rounded-full border ${on ? 'bg-accent border-accent' : 'border-line'}`} />
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-ink-muted">Pulled</span>
          <span className={`tnum font-semibold ${covered ? 'text-ok' : 'text-ink'}`}>
            {formatDollars(pulled)} / {formatDollars(overdraftCents)}
          </span>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 border border-line rounded-lg py-3 text-ink-muted press">
            Cancel
          </button>
          <button
            disabled={!covered || pulls.length === 0}
            onClick={() => onConfirm(pulls)}
            className="flex-1 bg-accent text-black font-semibold rounded-lg py-3 press disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
