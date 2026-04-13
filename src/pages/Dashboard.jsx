import { useEffect, useMemo, useState } from 'react';
import { useMonth, computeMonthTotals } from '../hooks/useMonth.js';
import { useFixedBills } from '../hooks/useFixedBills.js';
import { currentMonthKey, monthLabel, shiftMonth } from '../lib/money.js';
import { applyFixedBillsForMonth } from '../lib/monthInit.js';
import TopBar from '../components/TopBar.jsx';
import CategoryCard from '../components/CategoryCard.jsx';
import TabSwitcher from '../components/TabSwitcher.jsx';
import FixedBillsTab from '../components/FixedBillsTab.jsx';
import AddTransactionSheet from '../components/AddTransactionSheet.jsx';
import AddIncomeSheet from '../components/AddIncomeSheet.jsx';
import CategoryDetailSheet from '../components/CategoryDetailSheet.jsx';

export default function Dashboard({ user, onLogout, onOpenSettings }) {
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [tab, setTab] = useState('categories');
  const [showAddTx, setShowAddTx] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [detailCat, setDetailCat] = useState(null);

  const monthData = useMonth(monthKey);
  const { bills: fixedBills } = useFixedBills();
  const totals = useMemo(() => computeMonthTotals(monthData), [monthData]);

  const isCurrent = monthKey === currentMonthKey();
  const monthNotSetUp = !monthData.loading && !monthData.meta;
  const needsFixedApply =
    !monthData.loading &&
    monthData.meta &&
    !monthData.meta.fixedBillsApplied &&
    fixedBills.length > 0 &&
    isCurrent;

  useEffect(() => {
    if (needsFixedApply) {
      applyFixedBillsForMonth({ monthKey, uid: user?.uid }).catch(() => {});
    }
  }, [needsFixedApply, monthKey, user?.uid]);

  const fixedTxs = monthData.transactions.filter((t) => t.isFixed);

  return (
    <div className="min-h-full pb-28">
      <TopBar
        monthKey={monthKey}
        monthLabel={monthLabel(monthKey)}
        cashRemaining={totals.cashRemaining}
        totalBudgeted={totals.totalBudgeted}
        totalSpent={totals.totalSpent}
        onPrev={() => setMonthKey((m) => shiftMonth(m, -1))}
        onNext={() => setMonthKey((m) => shiftMonth(m, +1))}
        onSettings={onOpenSettings}
        onLogout={onLogout}
        isCurrent={isCurrent}
      />

      <div className="px-5 pt-4 space-y-4">
        {monthData.loading && (
          <div className="text-ink-muted text-sm py-10 text-center">Loading…</div>
        )}

        {monthNotSetUp && (
          <div className="bg-bg-raised border border-line rounded-xl p-5 text-center">
            <div className="text-ink font-medium mb-1">{monthLabel(monthKey)} not set up</div>
            <div className="text-ink-muted text-sm mb-4">
              {isCurrent
                ? 'Open Settings to initialize this month and apply your fixed bills.'
                : 'This month has no data.'}
            </div>
            {isCurrent && (
              <button
                onClick={onOpenSettings}
                className="bg-accent text-black font-semibold rounded-lg px-4 py-2.5 press"
              >
                Set up month
              </button>
            )}
          </div>
        )}

        {!monthData.loading && monthData.meta && (
          <>
            <TabSwitcher
              value={tab}
              onChange={setTab}
              tabs={[
                { value: 'categories', label: 'Categories', badge: totals.categoryStates.length || null },
                { value: 'fixed', label: 'Fixed Bills', badge: fixedTxs.length || null },
              ]}
            />

            {tab === 'categories' ? (
              totals.categoryStates.length === 0 ? (
                <div className="text-ink-muted text-sm py-10 text-center border border-dashed border-line rounded-xl">
                  No categories defined — open Settings to add some.
                </div>
              ) : (
                <div className="space-y-3">
                  {totals.categoryStates.map((c) => (
                    <CategoryCard
                      key={c.id}
                      cat={c}
                      onClick={() => setDetailCat(c)}
                    />
                  ))}
                </div>
              )
            ) : (
              <FixedBillsTab
                fixedTransactions={fixedTxs}
                categories={monthData.categories}
                onManage={onOpenSettings}
              />
            )}
          </>
        )}
      </div>

      {isCurrent && monthData.meta && (
        <div className="fixed bottom-6 right-5 left-5 flex items-end justify-between pointer-events-none">
          <button
            onClick={() => setShowAddIncome(true)}
            className="pointer-events-auto bg-bg-elevated border border-line text-ink-muted px-4 py-2.5 rounded-full text-sm press"
          >
            + Income
          </button>
          <button
            onClick={() => setShowAddTx(true)}
            aria-label="Add transaction"
            className="pointer-events-auto w-14 h-14 rounded-full bg-accent text-black font-bold text-2xl flex items-center justify-center shadow-lg press"
          >
            +
          </button>
        </div>
      )}

      <AddTransactionSheet
        open={showAddTx}
        onClose={() => setShowAddTx(false)}
        monthKey={monthKey}
        categories={monthData.categories}
        categoryStates={totals.categoryStates}
        uid={user?.uid}
      />
      <AddIncomeSheet
        open={showAddIncome}
        onClose={() => setShowAddIncome(false)}
        monthKey={monthKey}
        uid={user?.uid}
      />
      <CategoryDetailSheet
        open={!!detailCat}
        onClose={() => setDetailCat(null)}
        monthKey={monthKey}
        cat={detailCat}
        transactions={monthData.transactions}
        editable={isCurrent}
      />
    </div>
  );
}
