import { Link } from 'react-router-dom';
import { formatDollars } from '../lib/money.js';

export default function AvailableStrip({
  fixedIncomeCents,
  sideIncomeCents,
  fixedBillsCents,
  toWorkWith,
  envelopeBudgetCents,
  unallocatedCents,
  variableRemaining,
  sideIncomeHref,
}) {
  return (
    <div className="bg-bg-raised border border-line rounded-xl p-4">
      <Row label="Expected income" value={fixedIncomeCents} />
      {sideIncomeCents > 0 && (
        sideIncomeHref ? (
          <Link to={sideIncomeHref} className="block press -mx-1 px-1 rounded">
            <Row label="Side income" value={sideIncomeCents} sign link />
          </Link>
        ) : (
          <Row label="Side income" value={sideIncomeCents} sign />
        )
      )}
      <Row label="Fixed bills" value={-fixedBillsCents} />
      <div className="border-t border-line my-2" />
      <div className="flex items-center justify-between">
        <div className="text-ink text-sm font-medium">To work with</div>
        <div
          className={`tnum text-xl font-semibold ${
            toWorkWith < 0 ? 'text-bad' : 'text-ink'
          }`}
        >
          {formatDollars(toWorkWith)}
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-line space-y-1">
        <Row label="Envelope budgets" value={envelopeBudgetCents} muted />
        <div className="flex items-center justify-between pt-1">
          <div className="text-ink-muted text-sm">Unallocated</div>
          <div
            className={`tnum text-sm font-semibold ${
              unallocatedCents > 0
                ? 'text-ok'
                : unallocatedCents < 0
                ? 'text-bad'
                : 'text-ink-muted'
            }`}
          >
            {formatDollars(unallocatedCents, { sign: true })}
          </div>
        </div>
        {unallocatedCents > 0 && (
          <div className="text-[11px] text-ink-faint">
            Extra to add to an envelope or leave as savings buffer.
          </div>
        )}
        {unallocatedCents < 0 && (
          <div className="text-[11px] text-bad/80">
            Envelopes exceed what's available — trim a budget.
          </div>
        )}
      </div>
      <div className="mt-2 text-[11px] text-ink-faint tnum flex items-center justify-between">
        <span>Left in envelopes</span>
        <span className={variableRemaining < 0 ? 'text-bad' : ''}>
          {formatDollars(variableRemaining)}
        </span>
      </div>
    </div>
  );
}

function Row({ label, value, muted, sign, link }) {
  const display = sign ? formatDollars(value, { sign: true }) : formatDollars(value);
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className={`inline-flex items-center gap-1 ${muted ? 'text-ink-muted' : 'text-ink-muted'}`}>
        {label}
        {link && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-faint">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        )}
      </span>
      <span className={`tnum ${muted ? 'text-ink-muted' : 'text-ink'}`}>
        {display}
      </span>
    </div>
  );
}
