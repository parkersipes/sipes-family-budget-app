import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { useMonthCloses } from '../hooks/useMonthCloses.js';
import { formatDollars, monthLabel } from '../lib/money.js';

export default function HistoryPage() {
  const { closes, loading } = useMonthCloses();

  return (
    <div className="min-h-full pb-10">
      <PageHeader title="Past Months" subtitle="Closed month summaries" backTo="/settings" />
      <div className="px-5 pt-4 space-y-3">
        {loading ? (
          <div className="text-ink-muted text-sm text-center py-10">Loading…</div>
        ) : closes.length === 0 ? (
          <div className="text-ink-muted text-sm py-10 text-center border border-dashed border-line rounded-xl">
            No months closed yet. Close the current month at the end of the month to start a record.
          </div>
        ) : (
          <div className="divide-y divide-line border border-line rounded-xl bg-bg-raised overflow-hidden">
            {closes.map((c) => {
              const net = c.netResult || 0;
              const mk = c.monthId || c.id;
              return (
                <Link
                  key={c.id}
                  to={`/m/${mk}/summary`}
                  className="flex items-center justify-between px-4 py-3 gap-3 press"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-ink font-medium truncate">{monthLabel(mk)}</div>
                    <div className="text-ink-faint text-xs mt-0.5">
                      {net >= 0 ? 'Finished ahead' : 'Over budget'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`tnum font-semibold ${
                        net >= 0 ? 'text-ok' : 'text-bad'
                      }`}
                    >
                      {net >= 0 ? '+' : '-'}
                      {formatDollars(Math.abs(net))}
                    </div>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-ink-faint"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
