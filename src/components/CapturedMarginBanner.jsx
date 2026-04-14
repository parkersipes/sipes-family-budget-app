import { useEffect, useState } from 'react';
import { formatDollars, shiftMonth, monthLabel } from '../lib/money.js';
import { getDocs, getDoc } from 'firebase/firestore';
import {
  monthDocRef,
  transactionsCol,
  incomeCol,
} from '../lib/firestore.js';

// Reads the prior month one-off and shows a banner either celebrating captured
// margin (positive) or warning about overspend (negative).
export default function CapturedMarginBanner({ currentMonthKey }) {
  const [margin, setMargin] = useState(null);
  const prevKey = shiftMonth(currentMonthKey, -1);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const metaSnap = await getDoc(monthDocRef(prevKey));
        if (!metaSnap.exists()) return;
        const [txSnap, inSnap] = await Promise.all([
          getDocs(transactionsCol(prevKey)),
          getDocs(incomeCol(prevKey)),
        ]);
        const starting = metaSnap.data().totalStartingValue || 0;
        const income = inSnap.docs.reduce((a, d) => a + (d.data().amount || 0), 0);
        const spent = txSnap.docs.reduce((a, d) => a + (d.data().amount || 0), 0);
        const m = starting + income - spent;
        if (!cancelled) setMargin(m);
      } catch {
        /* ignore */
      }
    }
    load();
    return () => { cancelled = true; };
  }, [prevKey]);

  if (margin == null || margin === 0) return null;

  if (margin > 0) {
    return (
      <div className="bg-accent/10 border border-accent/40 rounded-xl p-4 flex items-start gap-3">
        <div className="text-2xl leading-none">🎉</div>
        <div className="flex-1">
          <div className="text-ink font-semibold">
            Captured margin from {monthLabel(prevKey)}
          </div>
          <div className="text-ink-muted text-sm mt-0.5">
            You ended with <span className="tnum text-ink font-medium">{formatDollars(margin)}</span> left over.
            Move it into savings.
          </div>
        </div>
      </div>
    );
  }

  const overspend = Math.abs(margin);
  return (
    <div className="bg-bad/10 border border-bad/40 rounded-xl p-4 flex items-start gap-3">
      <div className="text-2xl leading-none">⚠️</div>
      <div className="flex-1">
        <div className="text-ink font-semibold">
          Overspent in {monthLabel(prevKey)}
        </div>
        <div className="text-ink-muted text-sm mt-0.5">
          You spent <span className="tnum text-bad font-medium">{formatDollars(overspend)}</span> more than you earned.
          Tighten envelopes or plan to catch up this month.
        </div>
      </div>
    </div>
  );
}
