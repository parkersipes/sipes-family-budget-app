import PageHeader from '../components/PageHeader.jsx';
import { useFixedBills } from '../hooks/useFixedBills.js';
import { formatDollars } from '../lib/money.js';
import FixedBillsManager from '../components/FixedBillsManager.jsx';

export default function SettingsFixedBills() {
  const { bills } = useFixedBills();
  const total = bills.reduce((a, b) => a + (b.amount || 0), 0);

  return (
    <div className="min-h-full pb-10">
      <PageHeader
        title="Recurring Bills"
        subtitle="Recurring obligations — auto-deducted from income"
        backTo="/settings"
      />
      <div className="px-5 pt-4 space-y-4">
        <div className="bg-bg-raised border border-line rounded-xl p-4">
          <div className="text-ink-muted text-[10px] uppercase tracking-widest">Monthly total</div>
          <div className="tnum text-3xl font-semibold text-ink mt-1">{formatDollars(total)}</div>
          <div className="text-ink-faint text-xs mt-1">
            {bills.length} {bills.length === 1 ? 'bill' : 'bills'} — applied the 1st of each new month.
          </div>
        </div>
        <FixedBillsManager bills={bills} />
      </div>
    </div>
  );
}
