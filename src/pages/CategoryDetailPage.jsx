import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { useMonth, computeMonthTotals } from '../hooks/useMonth.js';
import {
  formatDollars, currentMonthKey, monthLabel, isRecurringTx, effectiveAmount,
} from '../lib/money.js';
import { deleteTransaction } from '../lib/firestore.js';

export default function CategoryDetailPage() {
  const nav = useNavigate();
  const { monthKey: mk, categoryId } = useParams();
  const monthKey = mk || currentMonthKey();
  const isCurrent = monthKey === currentMonthKey();
  const monthData = useMonth(monthKey);
  const totals = useMemo(() => computeMonthTotals(monthData), [monthData]);

  const cat = totals.categoryStates.find((c) => c.id === categoryId);
  const catById = Object.fromEntries(totals.categoryStates.map((c) => [c.id, c]));

  // Transactions for this category: direct hits + any that pulled from this category.
  const entries = useMemo(() => {
    if (!cat) return [];
    const list = [];
    for (const t of monthData.transactions) {
      if (t.categoryId === cat.id) {
        const pulled = Array.isArray(t.pulls) ? t.pulls.reduce((a, p) => a + (p.amount || 0), 0) : 0;
        list.push({
          ...t,
          effective: (t.amount || 0) - pulled,
          kind: 'direct',
        });
      }
      if (Array.isArray(t.pulls)) {
        const p = t.pulls.find((x) => x.categoryId === cat.id);
        if (p) {
          list.push({
            ...t,
            effective: p.amount,
            kind: 'pulled',
            originatorCategoryId: t.categoryId,
          });
        }
      }
    }
    return list.sort((a, b) => {
      const ar = isRecurringTx(a);
      const br = isRecurringTx(b);
      if (ar !== br) return ar ? -1 : 1;
      return (b.date || '').localeCompare(a.date || '');
    });
  }, [cat, monthData.transactions]);

  const isClosed = !!monthData.meta?.closed;
  async function onDelete(id) {
    if (!isCurrent || isClosed) return;
    if (!confirm('Delete this transaction?')) return;
    await deleteTransaction(monthKey, id);
  }

  if (!monthData.loading && !cat) {
    return (
      <div className="min-h-full">
        <PageHeader title="Envelope" backTo={`/m/${monthKey}`} />
        <div className="px-5 pt-10 text-ink-muted text-sm text-center">Envelope not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-10">
      <PageHeader title={cat?.name || '…'} subtitle={monthLabel(monthKey)} backTo={`/m/${monthKey}`} />
      <div className="px-5 pt-4 space-y-4">
        <div className="bg-bg-raised border border-line rounded-xl p-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-ink-muted text-[10px] uppercase tracking-widest">Remaining</div>
              <div
                className={`tnum text-3xl font-semibold ${
                  cat && cat.remaining < 0 ? 'text-bad' : 'text-ink'
                }`}
              >
                {formatDollars(cat?.remaining || 0)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-ink-muted text-xs">Budget</div>
              <div className="tnum text-ink">{formatDollars(cat?.maxBudget || 0)}</div>
              <div className="tnum text-ink-faint text-xs mt-1">spent {formatDollars(cat?.spent || 0)}</div>
            </div>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="text-ink-muted text-sm py-10 text-center border border-dashed border-line rounded-xl">
            No transactions yet.
          </div>
        ) : (
          <div className="divide-y divide-line border border-line rounded-xl bg-bg-raised overflow-hidden">
            {entries.map((t) => (
              <div key={`${t.id}-${t.kind}`} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {isRecurringTx(t) && <Badge>Recurring</Badge>}
                    {t.isVariable && t.actualAmount == null && <Badge accent>⏳ Est.</Badge>}
                    {t.kind === 'pulled' && <Badge accent>Pulled</Badge>}
                    <div className={`truncate ${isRecurringTx(t) ? 'text-ink-muted' : 'text-ink'}`}>
                      {t.vendor}
                    </div>
                  </div>
                  <div className="text-ink-faint text-xs mt-0.5">
                    {t.date}
                    {t.description ? ` · ${t.description}` : ''}
                    {t.createdByName && !isRecurringTx(t) && (
                      <> · by {t.createdByName}</>
                    )}
                    {t.kind === 'pulled' && catById[t.originatorCategoryId] && (
                      <> · covered for {catById[t.originatorCategoryId].name}</>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`tnum ${isRecurringTx(t) ? 'text-ink-muted' : 'text-ink'}`}>
                    {formatDollars(t.effective)}
                  </div>
                  {isCurrent && !isRecurringTx(t) && t.kind === 'direct' && (
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
    </div>
  );
}

function Badge({ children, accent }) {
  return (
    <span
      className={`text-[10px] tracking-widest uppercase rounded px-1.5 py-0.5 border ${
        accent ? 'text-accent border-accent/40' : 'text-ink-muted border-line'
      }`}
    >
      {children}
    </span>
  );
}
