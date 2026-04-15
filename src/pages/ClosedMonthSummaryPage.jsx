import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { getMonthClose } from '../lib/firestore.js';
import { formatDollars, monthLabel } from '../lib/money.js';

export default function ClosedMonthSummaryPage() {
  const nav = useNavigate();
  const { monthKey } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const snap = await getMonthClose(monthKey);
      if (!cancelled) {
        setData(snap);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [monthKey]);

  if (loading) {
    return (
      <div className="min-h-full">
        <PageHeader title="Month Summary" backTo="/history" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-full">
        <PageHeader title="Month Summary" backTo="/history" />
        <div className="px-5 pt-8 text-center text-ink-muted text-sm">
          No archived summary found for this month.
        </div>
      </div>
    );
  }

  const {
    recurringBillVariance = 0,
    envelopeVariance = 0,
    netResult = 0,
    billDetails = [],
    categoryDetails = [],
  } = data;

  const aheadOrOver = netResult >= 0 ? 'ahead' : 'over budget';

  return (
    <div className="min-h-full pb-10">
      <PageHeader
        title={monthLabel(monthKey)}
        subtitle="Closed ✓"
        backTo="/history"
      />

      <div className="px-5 pt-4 space-y-5">
        <div className="bg-bg-raised border border-line rounded-2xl px-5 py-8 text-center">
          <div className="text-ink-muted text-[10px] uppercase tracking-widest">Net result</div>
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
        </div>

        <Section title="Recurring Bill Reconciliation">
          {billDetails.length === 0 ? (
            <Empty>No variable recurring bills this month.</Empty>
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

        <Section title="Envelope Spending">
          {categoryDetails.length === 0 ? (
            <Empty>No envelopes.</Empty>
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

        <button
          onClick={() => nav(`/m/${monthKey}`)}
          className="w-full border border-line text-ink-muted rounded-lg py-3 press text-sm"
        >
          View month →
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div className="text-ink-muted text-[10px] uppercase tracking-widest mb-2">{title}</div>
      {children}
    </div>
  );
}

function Empty({ children }) {
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
              className={`${j === 0 ? 'text-ink-muted font-medium' : 'text-right tnum'}`}
            >
              {cell}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
