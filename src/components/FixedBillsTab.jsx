import { formatDollars } from '../lib/money.js';

export default function FixedBillsTab({ fixedTransactions, categories, onManage }) {
  const total = fixedTransactions.reduce((a, t) => a + (t.amount || 0), 0);
  const catById = Object.fromEntries(categories.map((c) => [c.id, c]));
  const sorted = fixedTransactions
    .slice()
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  return (
    <div className="space-y-3">
      <div className="bg-bg-raised border border-line rounded-xl p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-ink-muted text-[10px] uppercase tracking-widest">Committed this month</div>
            <div className="tnum text-3xl font-semibold text-ink mt-1">{formatDollars(total)}</div>
            <div className="text-ink-faint text-xs mt-1">
              {sorted.length} {sorted.length === 1 ? 'bill' : 'bills'} auto-applied
            </div>
          </div>
          <button
            onClick={onManage}
            className="text-accent text-sm press border border-line rounded-lg px-3 py-1.5"
          >
            Manage
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-ink-muted text-sm py-10 text-center border border-dashed border-line rounded-xl">
          No fixed bills for this month.
          <div className="mt-3">
            <button onClick={onManage} className="text-accent press">Add one in Settings →</button>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-line border border-line rounded-xl bg-bg-raised overflow-hidden">
          {sorted.map((t) => {
            const cat = catById[t.categoryId];
            return (
              <div key={t.id} className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <LockIcon />
                    <div className="text-ink font-medium truncate">{t.vendor}</div>
                  </div>
                  <div className="text-ink-faint text-xs mt-1 flex items-center gap-2">
                    {cat && (
                      <span className="flex items-center gap-1.5">
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ background: cat.color }}
                        />
                        {cat.name}
                      </span>
                    )}
                    <span>·</span>
                    <span>due {formatDay(t.date)}</span>
                  </div>
                </div>
                <div className="tnum text-ink">{formatDollars(t.amount)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatDay(iso) {
  if (!iso) return '';
  const d = Number(iso.slice(8, 10));
  return d ? `day ${d}` : '';
}

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent flex-shrink-0">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
