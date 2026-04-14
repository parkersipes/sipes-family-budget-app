import { Link } from 'react-router-dom';
import { formatDollars } from '../lib/money.js';

export default function TopBar({
  monthLabel,
  cashRemaining,
  envelopeBudgeted,
  envelopeSpent,
  onPrev,
  onNext,
  isCurrent,
}) {
  const pct = envelopeBudgeted > 0 ? Math.min(100, (envelopeSpent / envelopeBudgeted) * 100) : 0;

  return (
    <div className="sticky top-0 z-20 bg-bg/95 backdrop-blur border-b border-line">
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <button onClick={onPrev} className="text-ink-muted press p-1" aria-label="Previous month">
            <Chevron dir="left" />
          </button>
          <div className="text-center">
            <div className="text-ink text-sm font-medium">{monthLabel}</div>
            <div className="text-ink-faint text-[10px] uppercase tracking-widest mt-0.5">
              {isCurrent ? 'Current' : 'Viewing'}
            </div>
          </div>
          <button onClick={onNext} className="text-ink-muted press p-1" aria-label="Next month">
            <Chevron dir="right" />
          </button>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <div className="text-ink-muted text-[10px] uppercase tracking-widest">Remaining</div>
            <div
              className={`tnum text-3xl font-semibold mt-0.5 ${
                cashRemaining < 0 ? 'text-bad' : 'text-ink'
              }`}
            >
              {formatDollars(cashRemaining)}
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to="/settings"
              aria-label="Settings"
              className="w-9 h-9 rounded-lg border border-line text-ink-muted flex items-center justify-center press"
            >
              <Gear />
            </Link>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 h-1 bg-bg-raised rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bar-fill ${
                pct > 90 ? 'bg-bad' : pct > 70 ? 'bg-warn' : 'bg-ok'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="tnum text-ink-muted text-xs">
            {formatDollars(envelopeSpent)} / {formatDollars(envelopeBudgeted)} envelopes
          </div>
        </div>
      </div>
    </div>
  );
}

function Chevron({ dir }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {dir === 'left' ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
    </svg>
  );
}
function Gear() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
