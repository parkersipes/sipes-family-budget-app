import { useState } from 'react';
import { formatDollars } from '../lib/money.js';
import ReconcileBillModal from './ReconcileBillModal.jsx';

export default function FixedBillsTab({ fixedTransactions, onManage, monthKey, readOnly }) {
  const [reconciling, setReconciling] = useState(null);

  const total = fixedTransactions.reduce(
    (a, t) => a + (t.actualAmount ?? t.estimatedAmount ?? t.amount ?? 0),
    0
  );
  const sorted = fixedTransactions
    .slice()
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const unreconciledCount = sorted.filter(
    (t) => t.isVariable && t.actualAmount == null
  ).length;

  return (
    <div className="space-y-3">
      <div className="bg-bg-raised border border-line rounded-xl p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-ink-muted text-[10px] uppercase tracking-widest">Committed this month</div>
            <div className="tnum text-3xl font-semibold text-ink mt-1">{formatDollars(total)}</div>
            <div className="text-ink-faint text-xs mt-1">
              {sorted.length} {sorted.length === 1 ? 'bill' : 'bills'} auto-applied
              {unreconciledCount > 0 && (
                <span className="text-warn"> · {unreconciledCount} to reconcile</span>
              )}
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
          No recurring bills for this month.
          <div className="mt-3">
            <button onClick={onManage} className="text-accent press">Add one in Settings →</button>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-line border border-line rounded-xl bg-bg-raised overflow-hidden">
          {sorted.map((t) => {
            const variable = !!t.isVariable;
            const reconciled = t.actualAmount != null;
            const displayAmount = t.actualAmount ?? t.estimatedAmount ?? t.amount ?? 0;
            const delta = variable && reconciled
              ? (t.estimatedAmount ?? 0) - (t.actualAmount ?? 0)
              : 0;
            const clickable = variable && !readOnly;
            const Wrapper = clickable ? 'button' : 'div';
            return (
              <Wrapper
                key={t.id}
                onClick={clickable ? () => setReconciling(t) : undefined}
                className={`w-full flex items-center justify-between px-4 py-3 gap-3 text-left ${
                  clickable ? 'press' : ''
                }`}
              >
                <div className="min-w-0 flex-1 flex items-center gap-2">
                  <LockIcon />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <div className="text-ink font-medium truncate">{t.vendor}</div>
                      {variable && !reconciled && (
                        <span className="text-[10px] tracking-wide uppercase text-warn border border-warn/30 rounded px-1.5 py-0.5 flex-shrink-0">
                          ⏳ Estimated
                        </span>
                      )}
                      {variable && reconciled && (
                        <span className="text-[10px] tracking-wide uppercase text-ok border border-ok/30 rounded px-1.5 py-0.5 flex-shrink-0">
                          ✓ Reconciled
                        </span>
                      )}
                    </div>
                    <div className="text-ink-faint text-xs mt-0.5">
                      due {formatDay(t.date)}
                      {variable && reconciled && (
                        <>
                          {' · '}
                          Est. {formatDollars(t.estimatedAmount || 0)} → Actual{' '}
                          {formatDollars(t.actualAmount || 0)}
                          {delta !== 0 && (
                            <span className={delta > 0 ? 'text-ok' : 'text-bad'}>
                              {' '}
                              ({delta > 0 ? '+' : ''}
                              {formatDollars(Math.abs(delta))})
                            </span>
                          )}
                          {t.reconciledByName && <> · by {t.reconciledByName}</>}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="tnum text-ink flex-shrink-0">{formatDollars(displayAmount)}</div>
              </Wrapper>
            );
          })}
        </div>
      )}

      <ReconcileBillModal
        open={!!reconciling}
        transaction={reconciling}
        monthKey={monthKey}
        onClose={() => setReconciling(null)}
      />
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
