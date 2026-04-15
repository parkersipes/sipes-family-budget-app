import { useEffect, useState } from 'react';
import { toCents, formatDollars } from '../lib/money.js';
import { reconcileTransaction } from '../lib/firestore.js';
import { useAuth } from '../hooks/useAuth.js';
import { userDisplayName } from '../lib/user.js';

export default function ReconcileBillModal({ open, transaction, monthKey, onClose }) {
  const { user } = useAuth();
  const [actual, setActual] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!open) return;
    const start = transaction?.actualAmount ?? transaction?.estimatedAmount ?? transaction?.amount ?? 0;
    setActual((start / 100).toFixed(2));
    setErr('');
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, transaction, onClose]);

  if (!open || !transaction) return null;

  const estimated = transaction.estimatedAmount ?? transaction.amount ?? 0;
  const actualCents = toCents(actual);
  const delta = estimated - actualCents;
  const alreadyReconciled = transaction.actualAmount != null;

  async function onConfirm() {
    setErr('');
    if (actualCents < 0) return setErr('Amount must be zero or greater.');
    setBusy(true);
    try {
      await reconcileTransaction(monthKey, transaction.id, actualCents, {
        uid: user?.uid || null,
        name: userDisplayName(user),
      });
      onClose();
    } catch (e) {
      setErr(e?.message || 'Failed to reconcile.');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-bg-raised border border-line rounded-2xl p-5">
        <div className="text-ink text-lg font-semibold mb-1">
          {alreadyReconciled ? 'Update Actual' : 'Reconcile Bill'}
        </div>
        <div className="text-ink-muted text-sm mb-4">
          {transaction.vendor}
        </div>

        <div className="bg-bg border border-line rounded-lg p-3 mb-3">
          <div className="text-ink-muted text-[10px] uppercase tracking-widest">Estimated</div>
          <div className="tnum text-ink text-xl font-semibold mt-0.5">
            {formatDollars(estimated)}
          </div>
        </div>

        <label className="block mb-2">
          <div className="text-ink-muted text-xs mb-1.5 tracking-wide uppercase">Actual amount</div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted tnum">$</span>
            <input
              inputMode="decimal"
              type="text"
              autoFocus
              value={actual}
              onChange={(e) => setActual(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
              className="w-full bg-bg border border-line rounded-lg pl-8 pr-4 py-3 text-ink tnum text-lg focus:border-accent focus:outline-none"
            />
          </div>
        </label>

        {actualCents > 0 && (
          <div className="text-sm mt-1 mb-1">
            {delta === 0 ? (
              <span className="text-ink-muted">Matches the estimate.</span>
            ) : delta > 0 ? (
              <span className="text-ok">
                {formatDollars(delta)} under estimate — returned to remaining cash.
              </span>
            ) : (
              <span className="text-bad">
                {formatDollars(-delta)} over estimate — deducted from remaining cash.
              </span>
            )}
          </div>
        )}

        {err && <div className="text-bad text-sm mt-2">{err}</div>}

        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 border border-line rounded-lg py-3 text-ink-muted press"
          >
            Cancel
          </button>
          <button
            disabled={busy || actualCents < 0}
            onClick={onConfirm}
            className="flex-1 bg-accent text-black font-semibold rounded-lg py-3 press disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
