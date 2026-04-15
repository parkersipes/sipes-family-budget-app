import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { useMonth, computeMonthTotals } from '../hooks/useMonth.js';
import ReconcileBillModal from '../components/ReconcileBillModal.jsx';
import {
  formatDollars,
  monthLabel,
  currentMonthKey,
  isRecurringTx,
} from '../lib/money.js';
import { writeMonthClose } from '../lib/firestore.js';

export default function CloseMonthPage({ user }) {
  const nav = useNavigate();
  const { monthKey: mk } = useParams();
  const monthKey = mk || currentMonthKey();
  const monthData = useMonth(monthKey);
  const totals = useMemo(() => computeMonthTotals(monthData), [monthData]);

  const [reconciling, setReconciling] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const recurring = monthData.transactions.filter((t) => isRecurringTx(t));
  const unreconciled = recurring.filter((t) => t.isVariable && t.actualAmount == null);
  const isClosed = !!monthData.meta?.closed;

  const billDetails = recurring
    .filter((t) => t.isVariable)
    .map((t) => ({
      name: t.vendor,
      estimated: t.estimatedAmount ?? t.amount ?? 0,
      actual: t.actualAmount ?? 0,
      delta: (t.estimatedAmount ?? 0) - (t.actualAmount ?? 0),
    }));

  const recurringBillVariance = billDetails.reduce((a, b) => a + b.delta, 0);

  const categoryDetails = totals.categoryStates.map((c) => ({
    name: c.name,
    budgeted: c.maxBudget || 0,
    spent: c.spent || 0,
    remaining: (c.maxBudget || 0) - (c.spent || 0),
  }));

  const envelopeVariance = categoryDetails.reduce((a, c) => a + c.remaining, 0);
  const netResult = recurringBillVariance + envelopeVariance;

  const biggestDriver = useMemo(() => {
    const candidates = [];
    for (const b of billDetails) {
      if (b.delta !== 0) candidates.push({ kind: 'bill', name: b.name, delta: b.delta });
    }
    for (const c of categoryDetails) {
      if (c.remaining !== 0) candidates.push({ kind: 'cat', name: c.name, delta: c.remaining });
    }
    candidates.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    return candidates[0];
  }, [billDetails, categoryDetails]);

  async function onConfirm() {
    setErr('');
    setBusy(true);
    try {
      await writeMonthClose(monthKey, {
        monthId: monthKey,
        closedBy: user?.uid || null,
        recurringBillVariance,
        envelopeVariance,
        netResult,
        billDetails,
        categoryDetails,
      });
      nav(`/m/${monthKey}`);
    } catch (e) {
      setErr(e?.message || 'Failed to close month.');
      setBusy(false);
    }
  }

  if (isClosed) {
    return (
      <div className="min-h-full">
        <PageHeader title="Close Month" backTo={`/m/${monthKey}`} />
        <div className="px-5 pt-8 text-center space-y-3">
          <div className="text-ink">This month is already closed.</div>
          <button
            onClick={() => nav(`/m/${monthKey}/summary`)}
            className="text-accent press"
          >
            View summary →
          </button>
        </div>
      </div>
    );
  }

  if (monthData.loading) {
    return (
      <div className="min-h-full">
        <PageHeader title="Close Month" backTo={`/m/${monthKey}`} />
      </div>
    );
  }

  // --- Pre-close gate ---
  if (unreconciled.length > 0) {
    return (
      <div className="min-h-full pb-10">
        <PageHeader
          title="Reconcile First"
          subtitle={monthLabel(monthKey)}
          backTo={`/m/${monthKey}`}
        />
        <div className="px-5 pt-4 space-y-4">
          <div className="border border-warn/40 bg-warn/5 rounded-xl p-4 text-sm text-ink">
            <div className="font-medium mb-1">
              {unreconciled.length} unreconciled bill{unreconciled.length === 1 ? '' : 's'}
            </div>
            <div className="text-ink-muted">
              Enter the actual amounts before closing — the numbers won't be right otherwise.
            </div>
          </div>
          <div className="divide-y divide-line border border-line rounded-xl bg-bg-raised overflow-hidden">
            {unreconciled.map((t) => (
              <button
                key={t.id}
                onClick={() => setReconciling(t)}
                className="w-full flex items-center justify-between px-4 py-3 gap-3 text-left press"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-ink font-medium truncate">{t.vendor}</div>
                  <div className="text-ink-faint text-xs mt-0.5">
                    Estimated {formatDollars(t.estimatedAmount ?? t.amount ?? 0)} — tap to enter actual
                  </div>
                </div>
                <div className="text-accent text-sm">Reconcile →</div>
              </button>
            ))}
          </div>
        </div>
        <ReconcileBillModal
          open={!!reconciling}
          transaction={reconciling}
          monthKey={monthKey}
          onClose={() => setReconciling(null)}
        />
      </div>
    );
  }

  // --- Summary view ---
  const aheadOrOver = netResult >= 0 ? 'ahead' : 'over budget';

  return (
    <div className="min-h-full pb-24">
      <PageHeader title="Close Month" subtitle={monthLabel(monthKey)} backTo={`/m/${monthKey}`} />

      <div className="px-5 pt-4 space-y-5">
        {/* Net result hero */}
        <div className="bg-bg-raised border border-line rounded-2xl px-5 py-8 text-center">
          <div className="text-ink-muted text-[10px] uppercase tracking-widest">
            Month net result
          </div>
          <div
            className={`tnum text-5xl font-bold mt-2 ${
              netResult >= 0 ? 'text-ok' : 'text-bad'
            }`}
          >
            {netResult >= 0 ? '+' : '-'}
            {formatDollars(Math.abs(netResult))}
          </div>
          <div className="text-ink mt-3 text-sm">
            You finished <span className="font-semibold">{monthLabel(monthKey)}</span>{' '}
            <span className={netResult >= 0 ? 'text-ok font-semibold' : 'text-bad font-semibold'}>
              {formatDollars(Math.abs(netResult))} {aheadOrOver}
            </span>
            .
          </div>
          {biggestDriver && (
            <div className="text-ink-faint text-xs mt-2">
              {describeDriver(biggestDriver)}
            </div>
          )}
        </div>

        {/* Recurring bill reconciliation */}
        <Section title="Recurring Bill Reconciliation">
          {billDetails.length === 0 ? (
            <EmptyRow>No variable recurring bills this month.</EmptyRow>
          ) : (
            <Table
              headers={['Bill', 'Est.', 'Actual', 'Delta']}
              rows={billDetails.map((b) => [
                b.name,
                formatDollars(b.estimated),
                formatDollars(b.actual),
                <span
                  key="d"
                  className={b.delta > 0 ? 'text-ok' : b.delta < 0 ? 'text-bad' : 'text-ink-muted'}
                >
                  {b.delta > 0 ? '+' : b.delta < 0 ? '-' : ''}
                  {formatDollars(Math.abs(b.delta))}
                </span>,
              ])}
              footer={[
                'Net variance',
                '',
                '',
                <span
                  key="d"
                  className={
                    recurringBillVariance > 0
                      ? 'text-ok font-semibold'
                      : recurringBillVariance < 0
                      ? 'text-bad font-semibold'
                      : 'text-ink-muted font-semibold'
                  }
                >
                  {recurringBillVariance > 0 ? '+' : recurringBillVariance < 0 ? '-' : ''}
                  {formatDollars(Math.abs(recurringBillVariance))}
                </span>,
              ]}
            />
          )}
        </Section>

        {/* Envelope spending */}
        <Section title="Envelope Spending">
          {categoryDetails.length === 0 ? (
            <EmptyRow>No envelopes.</EmptyRow>
          ) : (
            <Table
              headers={['Envelope', 'Budgeted', 'Spent', 'Remaining']}
              rows={categoryDetails.map((c) => [
                c.name,
                formatDollars(c.budgeted),
                formatDollars(c.spent),
                <span
                  key="r"
                  className={c.remaining >= 0 ? 'text-ok' : 'text-bad'}
                >
                  {c.remaining >= 0 ? '+' : '-'}
                  {formatDollars(Math.abs(c.remaining))}
                </span>,
              ])}
              footer={[
                'Net remaining',
                '',
                '',
                <span
                  key="r"
                  className={
                    envelopeVariance >= 0 ? 'text-ok font-semibold' : 'text-bad font-semibold'
                  }
                >
                  {envelopeVariance >= 0 ? '+' : '-'}
                  {formatDollars(Math.abs(envelopeVariance))}
                </span>,
              ]}
            />
          )}
        </Section>

        {err && <div className="text-bad text-sm">{err}</div>}
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-5 py-4 bg-bg/95 backdrop-blur border-t border-line flex gap-3">
        <button
          onClick={() => nav(`/m/${monthKey}`)}
          className="flex-1 border border-line rounded-lg py-3 text-ink-muted press"
        >
          Go Back
        </button>
        <button
          disabled={busy}
          onClick={onConfirm}
          className="flex-1 bg-accent text-black font-semibold rounded-lg py-3 press disabled:opacity-60"
        >
          {busy ? 'Closing…' : 'Close Month'}
        </button>
      </div>
    </div>
  );
}

function describeDriver(d) {
  if (!d) return null;
  if (d.kind === 'bill') {
    return d.delta > 0
      ? `${d.name} came in ${formatDollars(d.delta)} under estimate.`
      : `${d.name} came in ${formatDollars(-d.delta)} over estimate.`;
  }
  return d.delta > 0
    ? `${d.name} envelope finished ${formatDollars(d.delta)} under budget.`
    : `${d.name} envelope finished ${formatDollars(-d.delta)} over budget.`;
}

function Section({ title, children }) {
  return (
    <div>
      <div className="text-ink-muted text-[10px] uppercase tracking-widest mb-2">{title}</div>
      {children}
    </div>
  );
}

function EmptyRow({ children }) {
  return (
    <div className="text-ink-muted text-sm py-6 text-center border border-dashed border-line rounded-xl">
      {children}
    </div>
  );
}

function Table({ headers, rows, footer }) {
  return (
    <div className="border border-line rounded-xl bg-bg-raised overflow-hidden">
      <div className="grid grid-cols-4 gap-2 px-4 py-2 text-[10px] uppercase tracking-widest text-ink-faint border-b border-line">
        {headers.map((h, i) => (
          <div key={i} className={i === 0 ? 'col-span-1' : 'text-right tnum'}>
            {h}
          </div>
        ))}
      </div>
      <div className="divide-y divide-line">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-4 gap-2 px-4 py-2.5 text-sm">
            {r.map((cell, j) => (
              <div
                key={j}
                className={`${j === 0 ? 'text-ink truncate' : 'text-right tnum text-ink'}`}
              >
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>
      {footer && (
        <div className="grid grid-cols-4 gap-2 px-4 py-2.5 text-sm bg-bg border-t border-line">
          {footer.map((cell, j) => (
            <div
              key={j}
              className={`${
                j === 0 ? 'text-ink-muted font-medium' : 'text-right tnum'
              }`}
            >
              {cell}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
