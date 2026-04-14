import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { useFixedIncome } from '../hooks/useFixedIncome.js';
import { useFixedBills } from '../hooks/useFixedBills.js';
import { useMonth, computeMonthTotals } from '../hooks/useMonth.js';
import { currentMonthKey } from '../lib/money.js';
import { formatDollars } from '../lib/money.js';
import MonthChart from '../components/MonthChart.jsx';
import { useMemo } from 'react';

export default function SettingsIndex({ onLogout }) {
  const monthKey = currentMonthKey();
  const monthData = useMonth(monthKey);
  const { entries: income } = useFixedIncome();
  const { bills } = useFixedBills();
  const totals = useMemo(() => computeMonthTotals(monthData), [monthData]);

  const fixedIncomeTotal = income.reduce((a, i) => a + (i.amount || 0), 0);
  const fixedBillsTotal = bills.reduce((a, b) => a + (b.amount || 0), 0);

  return (
    <div className="min-h-full pb-10">
      <PageHeader title="Settings" backTo="/" />
      <div className="px-5 pt-4 space-y-3">
        <Row
          to="/settings/income"
          label="Fixed Income"
          value={formatDollars(fixedIncomeTotal)}
          detail={`${income.length} ${income.length === 1 ? 'source' : 'sources'}`}
        />
        <Row
          to="/settings/bills"
          label="Fixed Bills"
          value={formatDollars(fixedBillsTotal)}
          detail={`${bills.length} ${bills.length === 1 ? 'bill' : 'bills'}`}
        />
        <Row
          to="/settings/categories"
          label="Envelopes"
          value={formatDollars(totals.totalBudgeted)}
          detail={`${monthData.categories.length} ${monthData.categories.length === 1 ? 'envelope' : 'envelopes'} this month`}
        />

        <div className="pt-4">
          <MonthChart categoryStates={totals.categoryStates} />
        </div>

        <button
          onClick={onLogout}
          className="w-full mt-4 border border-line text-ink-muted rounded-lg py-3 press"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

function Row({ to, label, value, detail }) {
  return (
    <Link
      to={to}
      className="block bg-bg-raised border border-line rounded-xl p-4 press"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-ink font-medium">{label}</div>
          <div className="text-ink-faint text-xs mt-0.5">{detail}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="tnum text-ink">{value}</div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-faint">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
