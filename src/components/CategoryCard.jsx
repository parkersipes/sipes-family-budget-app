import { formatDollars } from '../lib/money.js';

const STATUS_BAR = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  bad: 'bg-bad',
};

export default function CategoryCard({ cat, onClick }) {
  const max = cat.maxBudget || 0;
  const fixedPct = max > 0 ? Math.min(100, (cat.fixedSpent / max) * 100) : 0;
  const varSpent = Math.max(0, cat.spent - cat.fixedSpent);
  const varPct = max > 0 ? Math.min(100 - fixedPct, (varSpent / max) * 100) : 0;
  const variableRemaining = Math.max(0, (max - cat.fixedSpent) - varSpent);

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
      <div className="mt-3 h-1.5 bg-bg rounded-full overflow-hidden flex">
        {fixedPct > 0 && (
          <div
            className="h-full bg-ink-faint bar-fill"
            style={{ width: `${fixedPct}%` }}
            title="Fixed bills committed"
          />
        )}
        {varPct > 0 && (
          <div
            className={`h-full bar-fill ${STATUS_BAR[cat.status]}`}
            style={{ width: `${varPct}%` }}
          />
        )}
      </div>
      {cat.fixedSpent > 0 && (
        <div className="mt-2 flex items-center justify-between text-[11px] tnum">
          <span className="text-ink-faint flex items-center gap-1.5">
            <LockIcon />
            {formatDollars(cat.fixedSpent)} fixed
          </span>
          <span className="text-ink-muted">
            {formatDollars(variableRemaining)} variable left
          </span>
        </div>
      )}
    </button>
  );
}

function LockIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
