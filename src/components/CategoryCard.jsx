import { formatDollars } from '../lib/money.js';

const STATUS_BAR = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  bad: 'bg-bad',
};

export default function CategoryCard({ cat, onClick }) {
  const pct = Math.max(0, Math.min(100, cat.pct || 0));
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-bg-raised border border-line rounded-xl p-4 press"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: cat.color }}
            />
            <span className="text-ink font-medium truncate">{cat.name}</span>
          </div>
          <div className="text-ink-muted text-xs mt-1 tnum">
            of {formatDollars(cat.maxBudget)}
          </div>
        </div>
        <div className="text-right">
          <div
            className={`tnum text-xl font-semibold ${
              cat.remaining < 0 ? 'text-bad' : 'text-ink'
            }`}
          >
            {formatDollars(cat.remaining)}
          </div>
          <div className="text-ink-muted text-[11px] uppercase tracking-wider">left</div>
        </div>
      </div>
      <div className="mt-3 h-1.5 bg-bg rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bar-fill ${STATUS_BAR[cat.status]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </button>
  );
}
