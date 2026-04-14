import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { useMonth } from '../hooks/useMonth.js';
import {
  currentMonthKey, monthLabel, formatDollars, toCents, todayISO,
} from '../lib/money.js';
import { deleteIncome, updateIncome } from '../lib/firestore.js';
import { SIDE_INCOME_KINDS, sideIncomeLabel } from '../config.js';
import { TextField, AmountField, SelectField, PrimaryButton } from '../components/Field.jsx';

export default function SideIncomePage() {
  const { monthKey: mk } = useParams();
  const monthKey = mk || currentMonthKey();
  const isCurrent = monthKey === currentMonthKey();
  const monthData = useMonth(monthKey);
  const [editing, setEditing] = useState(null);

  const sideEvents = useMemo(
    () => monthData.income
      .filter((i) => !i.isFixed)
      .slice()
      .sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [monthData.income]
  );
  const total = sideEvents.reduce((a, i) => a + (i.amount || 0), 0);

  async function onDelete(entry) {
    if (!isCurrent) return;
    if (!confirm('Delete this income entry?')) return;
    await deleteIncome(monthKey, entry.id);
  }

  return (
    <div className="min-h-full pb-10">
      <PageHeader
        title="Side Income"
        subtitle={monthLabel(monthKey)}
        backTo={`/m/${monthKey}`}
        right={
          isCurrent && (
            <Link to="/add/income" className="text-accent text-sm press">
              + Add
            </Link>
          )
        }
      />
      <div className="px-5 pt-4 space-y-3">
        <div className="bg-bg-raised border border-line rounded-xl p-4">
          <div className="text-ink-muted text-[10px] uppercase tracking-widest">Total side income</div>
          <div className="tnum text-3xl font-semibold text-ink mt-1">{formatDollars(total)}</div>
          <div className="text-ink-faint text-xs mt-1">
            {sideEvents.length} {sideEvents.length === 1 ? 'entry' : 'entries'} this month
          </div>
        </div>

        {sideEvents.length === 0 ? (
          <div className="text-ink-muted text-sm py-10 text-center border border-dashed border-line rounded-xl">
            No side income yet.
          </div>
        ) : (
          <div className="divide-y divide-line border border-line rounded-xl bg-bg-raised">
            {sideEvents.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-4 py-3 gap-3">
                <button
                  onClick={() => isCurrent && setEditing(e)}
                  className="flex-1 text-left press min-w-0"
                  disabled={!isCurrent}
                >
                  <div className="text-ink font-medium truncate">
                    {sideIncomeLabel(e.kind)}
                    {e.source ? <span className="text-ink-muted font-normal"> · {e.source}</span> : null}
                  </div>
                  <div className="text-ink-faint text-xs mt-0.5">{e.date}</div>
                </button>
                <div className="flex items-center gap-3">
                  <div className="tnum text-ink">{formatDollars(e.amount)}</div>
                  {isCurrent && (
                    <button
                      onClick={() => onDelete(e)}
                      className="text-ink-faint press p-1"
                      aria-label="Delete"
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <EditorModal
          entry={editing}
          monthKey={monthKey}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function EditorModal({ entry, monthKey, onClose }) {
  const [kind, setKind] = useState(entry.kind || 'other');
  const [note, setNote] = useState(entry.source || '');
  const [amount, setAmount] = useState(((entry.amount || 0) / 100).toString());
  const [date, setDate] = useState(entry.date || todayISO());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  async function onSave(e) {
    e.preventDefault();
    setErr('');
    const cents = toCents(amount);
    if (cents <= 0) return setErr('Amount must be greater than zero.');
    setBusy(true);
    try {
      await updateIncome(monthKey, entry.id, {
        kind,
        source: note.trim(),
        amount: cents,
        date,
      });
      onClose();
    } catch (e) {
      setErr(e?.message || 'Failed to save.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full bg-bg-raised border-t border-line rounded-t-2xl p-5 pb-8">
        <div className="text-ink text-lg font-semibold mb-3">Edit Side Income</div>
        <form onSubmit={onSave} className="space-y-3">
          <SelectField label="Kind" value={kind} onChange={setKind}>
            {SIDE_INCOME_KINDS.map((k) => (
              <option key={k.key} value={k.key}>{k.label}</option>
            ))}
          </SelectField>
          <AmountField label="Amount" value={amount} onChange={setAmount} />
          <TextField
            label="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional"
          />
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          {err && <div className="text-bad text-sm">{err}</div>}
          <PrimaryButton disabled={busy}>{busy ? 'Saving…' : 'Save'}</PrimaryButton>
        </form>
      </div>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
