import Sheet from './Sheet.jsx';
import { formatDollars } from '../lib/money.js';
import { deleteTransaction } from '../lib/firestore.js';

export default function CategoryDetailSheet({ open, onClose, monthKey, cat, transactions, editable }) {
  if (!cat) return null;
  const txs = transactions
    .filter((t) => t.categoryId === cat.id)
    .sort((a, b) => {
      if (a.isFixed !== b.isFixed) return a.isFixed ? -1 : 1;
      return (b.date || '').localeCompare(a.date || '');
    });

  async function onDelete(id) {
    if (!editable) return;
    if (!confirm('Delete this transaction?')) return;
    await deleteTransaction(monthKey, id);
  }

  return (
    <Sheet open={open} onClose={onClose} title={cat.name}>
      <div className="pb-4">
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-ink-muted text-xs uppercase tracking-widest">Remaining</div>
            <div
              className={`tnum text-2xl font-semibold ${cat.remaining < 0 ? 'text-bad' : 'text-ink'}`}
            >
              {formatDollars(cat.remaining)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-ink-muted text-xs">Budget</div>
            <div className="tnum text-ink">{formatDollars(cat.maxBudget)}</div>
          </div>
        </div>
        {txs.length === 0 ? (
          <div className="text-ink-muted text-sm py-8 text-center">No transactions yet.</div>
        ) : (
          <div className="divide-y divide-line border border-line rounded-xl bg-bg">
            {txs.map((t) => (
              <div key={t.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {t.isFixed && (
                      <span className="text-[10px] tracking-widest uppercase text-accent border border-accent/40 rounded px-1.5 py-0.5">
                        Fixed
                      </span>
                    )}
                    <div className={`truncate ${t.isFixed ? 'text-ink-muted' : 'text-ink'}`}>
                      {t.vendor}
                    </div>
                  </div>
                  <div className="text-ink-faint text-xs mt-0.5">
                    {t.date}
                    {t.description ? ` · ${t.description}` : ''}
                    {t.pulledFromCategoryId ? ' · pulled from another' : ''}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`tnum ${t.isFixed ? 'text-ink-muted' : 'text-ink'}`}>
                    {formatDollars(t.amount)}
                  </div>
                  {editable && !t.isFixed && (
                    <button
                      onClick={() => onDelete(t.id)}
                      className="text-ink-faint press p-1"
                      aria-label="Delete"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
}
