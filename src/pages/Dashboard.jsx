import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMonth, computeMonthTotals } from '../hooks/useMonth.js';
import { useFixedIncome } from '../hooks/useFixedIncome.js';
import { useFixedBills } from '../hooks/useFixedBills.js';
import { currentMonthKey, monthLabel, shiftMonth, isRecurringTx } from '../lib/money.js';
import { ensureMonthInitialized, syncCurrentMonthFixedItems } from '../lib/monthInit.js';
import TopBar from '../components/TopBar.jsx';
import CategoryCard from '../components/CategoryCard.jsx';
import TabSwitcher from '../components/TabSwitcher.jsx';
import FixedBillsTab from '../components/FixedBillsTab.jsx';
import AvailableStrip from '../components/AvailableStrip.jsx';
import CapturedMarginBanner from '../components/CapturedMarginBanner.jsx';

export default function Dashboard({ user }) {
  const nav = useNavigate();
  const { monthKey: routeKey } = useParams();
  const monthKey = routeKey || currentMonthKey();
  const isCurrent = monthKey === currentMonthKey();

  const [tab, setTab] = useState('categories');
  const monthData = useMonth(monthKey);
  const { entries: fixedIncome } = useFixedIncome();
  const { bills: fixedBills } = useFixedBills();
  const totals = useMemo(() => computeMonthTotals(monthData), [monthData]);

  // A stable content hash of the household-level fixed items — changes only when
  // bills/income are actually added, edited, or removed, not on listener echo.
  const fixedBillsSig = useMemo(
    () => fixedBills
      .map((b) => `${b.id}:${b.amount}:${b.dueDay || 1}:${b.name || ''}:${b.amountType || 'fixed'}`)
      .sort()
      .join('|'),
    [fixedBills]
  );
  const fixedIncomeSig = useMemo(
    () => fixedIncome
      .map((i) => `${i.id}:${i.amount}:${i.dayOfMonth || 1}:${i.name || ''}`)
      .sort()
      .join('|'),
    [fixedIncome]
  );

  const isPast = monthKey < currentMonthKey();

  // Auto-initialize the month on first view (current or future), then keep
  // fixed items in sync whenever source bills/income change. Past months are
  // frozen snapshots — never touched.
  useEffect(() => {
    if (!user || isPast) return;
    if (monthData.loading) return;
    if (!monthData.meta?.initialized) {
      ensureMonthInitialized({ monthKey, uid: user.uid }).catch(() => {});
    } else {
      syncCurrentMonthFixedItems({ monthKey, uid: user.uid }).catch(() => {});
    }
  }, [
    user,
    isPast,
    monthKey,
    monthData.loading,
    monthData.meta?.initialized,
    fixedBillsSig,
    fixedIncomeSig,
  ]);

  const fixedTxs = monthData.transactions.filter((t) => isRecurringTx(t));
  const noCategories = !monthData.loading && monthData.categories.length === 0;
  const isFirstEver = !monthData.loading && !monthData.meta?.initialized && fixedIncome.length === 0 && fixedBills.length === 0;
  const isClosed = !!monthData.meta?.closed;
  const unreconciledCount = fixedTxs.filter((t) => t.isVariable && t.actualAmount == null).length;
  const canClose = !isPast && !isClosed && !monthData.loading;

  return (
    <div className="min-h-full pb-28">
      <TopBar
        monthLabel={monthLabel(monthKey)}
        cashRemaining={totals.cashRemaining}
        envelopeBudgeted={totals.variableBudget}
        envelopeSpent={totals.variableSpent}
        onPrev={() => nav(`/m/${shiftMonth(monthKey, -1)}`)}
        onNext={() => nav(`/m/${shiftMonth(monthKey, +1)}`)}
        isCurrent={isCurrent}
      />

      <div className="px-5 pt-4 space-y-4">
        {monthData.loading && (
          <div className="text-ink-muted text-sm py-10 text-center">Loading…</div>
        )}

        {isCurrent && <CapturedMarginBanner currentMonthKey={monthKey} />}

        {isFirstEver && (
          <div className="bg-bg-raised border border-line rounded-xl p-5 text-center">
            <div className="text-ink font-medium mb-1">Welcome — no data yet</div>
            <div className="text-ink-muted text-sm mb-4">
              Add recurring income, fixed bills, and envelopes in Settings to get rolling.
            </div>
            <Link
              to="/settings"
              className="inline-block bg-accent text-black font-semibold rounded-lg px-4 py-2.5 press"
            >
              Open Settings
            </Link>
          </div>
        )}

        {!monthData.loading && !isFirstEver && (
          <>
            <AvailableStrip
              fixedIncomeCents={totals.fixedIncomeCents}
              sideIncomeCents={totals.sideIncomeCents}
              fixedBillsCents={totals.fixedBillsCents}
              toWorkWith={totals.toWorkWith}
              envelopeBudgetCents={totals.totalBudgeted}
              unallocatedCents={totals.unallocatedCents}
              variableRemaining={totals.variableRemaining}
              sideIncomeHref={`/m/${monthKey}/income`}
            />

            {isClosed && (
              <div className="border border-ok/40 bg-ok/5 text-ink rounded-xl px-4 py-3 text-sm">
                <span className="text-ok font-semibold">Closed ✓</span> — this month is archived
                and read-only.{' '}
                <Link to={`/m/${monthKey}/summary`} className="text-accent press">
                  View summary →
                </Link>
              </div>
            )}

            {canClose && (
              <button
                onClick={() => nav(`/m/${monthKey}/close`)}
                className="w-full border border-line bg-bg-raised rounded-xl px-4 py-3 press flex items-center justify-between"
              >
                <div className="text-left">
                  <div className="text-ink font-medium">Close Month</div>
                  <div className="text-ink-faint text-xs mt-0.5">
                    {unreconciledCount > 0
                      ? `${unreconciledCount} bill${unreconciledCount === 1 ? '' : 's'} still to reconcile`
                      : 'Finalize and see your net result'}
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-faint">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}

            <TabSwitcher
              value={tab}
              onChange={setTab}
              tabs={[
                { value: 'categories', label: 'Envelopes', badge: totals.categoryStates.length || null },
                { value: 'fixed', label: 'Recurring Bills', badge: fixedTxs.length || null },
              ]}
            />

            {tab === 'categories' ? (
              noCategories ? (
                <div className="text-ink-muted text-sm py-10 text-center border border-dashed border-line rounded-xl">
                  No envelopes yet.{' '}
                  <Link to="/settings/categories" className="text-accent press">
                    Add some →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {totals.categoryStates.map((c) => (
                    <Link
                      key={c.id}
                      to={`/m/${monthKey}/category/${c.id}`}
                      className="block"
                    >
                      <CategoryCard cat={c} onClick={() => {}} />
                    </Link>
                  ))}
                </div>
              )
            ) : (
              <FixedBillsTab
                fixedTransactions={fixedTxs}
                onManage={() => nav('/settings/bills')}
                monthKey={monthKey}
                readOnly={isClosed || isPast}
              />
            )}
          </>
        )}
      </div>

      {isCurrent && !isClosed && (
        <div className="fixed bottom-6 right-5 left-5 flex items-end justify-between pointer-events-none">
          <Link
            to="/add/income"
            className="pointer-events-auto bg-bg-elevated border border-line text-ink-muted px-4 py-2.5 rounded-full text-sm press"
          >
            + Income
          </Link>
          <Link
            to="/add/transaction"
            aria-label="Add transaction"
            className="pointer-events-auto w-14 h-14 rounded-full bg-accent text-black font-bold text-2xl flex items-center justify-center shadow-lg press"
          >
            +
          </Link>
        </div>
      )}
    </div>
  );
}
