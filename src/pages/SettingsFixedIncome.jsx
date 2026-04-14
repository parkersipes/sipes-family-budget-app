import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import { useFixedIncome } from '../hooks/useFixedIncome.js';
import {
  addFixedIncome,
  updateFixedIncome,
  deleteFixedIncome,
} from '../lib/firestore.js';
import { formatDollars, toCents } from '../lib/money.js';
import { TextField, AmountField, PrimaryButton } from '../components/Field.jsx';

export default function SettingsFixedIncome() {
  const { entries } = useFixedIncome();
  const [editing, setEditing] = useState(null);

  const sorted = entries.slice().sort((a, b) => (a.dayOfMonth || 0) - (b.dayOfMonth || 0));
  const total = entries.reduce((a, i) => a + (i.amount || 0), 0);

  async function onDelete(entry) {
    if (!confirm(`Delete "${entry.name}"? It will no longer auto-apply to new months.`)) return;
    await deleteFixedIncome(entry.id);
  }

  return (
    <div className="min-h-full pb-10">
      <PageHeader
        title="Fixed Income"
        subtitle="Recurring salary and regular deposits"
        backTo="/settings"
        right={
          <button onClick={() => setEditing({})} className="text-accent text-sm press">
            + Add
          </button>
        }
      />
      <div className="px-5 pt-4 space-y-3">
        <div className="bg-bg-raised border border-line rounded-xl p-4">
          <div className="text-ink-muted text-[10px] uppercase tracking-widest">Monthly total</div>
          <div className="tnum text-3xl font-semibold text-ink mt-1">{formatDollars(total)}</div>
          <div className="text-ink-faint text-xs mt-1">
            {sorted.length} {sorted.length === 1 ? 'source' : 'sources'} — auto-applied each month.
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="text-ink-muted text-sm py-10 text-center border border-dashed border-line rounded-xl">
            No income sources yet. Add your salary to get started.
          </div>
        ) : (
          <div className="divide-y divide-line border border-line rounded-xl bg-bg-raised">
            {sorted.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-4 py-3 gap-3">
                <button
                  onClick={() => setEditing(e)}
                  className="flex-1 text-left press min-w-0"
                >
                  <div className="text-ink font-medium truncate">{e.name}</div>
                  <div className="text-ink-faint text-xs mt-0.5">day {e.dayOfMonth || 1}</div>
                </button>
                <div className="flex items-center gap-3">
                  <div className="tnum text-ink">{formatDollars(e.amount)}</div>
                  <button
                    onClick={() => onDelete(e)}
                    className="text-ink-faint press p-1"
                    aria-label="Delete"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <EditorModal
          entry={editing.id ? editing : null}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function EditorModal({ entry, onClose }) {
  const [name, setName] = useState(entry?.name || '');
  const [amount, setAmount] = useState(entry ? ((entry.amount || 0) / 100).toString() : '');
  const [day, setDay] = useState(String(entry?.dayOfMonth || 1));
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
    if (!name.trim()) return setErr('Name is required.');
    if (cents <= 0) return setErr('Amount must be greater than zero.');
    const d = Math.min(Math.max(parseInt(day, 10) || 1, 1), 31);
    setBusy(true);
    try {
      const payload = { name: name.trim(), amount: cents, dayOfMonth: d };
      if (entry?.id) await updateFixedIncome(entry.id, payload);
      else await addFixedIncome(payload);
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
        <div className="text-ink text-lg font-semibold mb-3">
          {entry ? 'Edit Income' : 'Add Income'}
        </div>
        <form onSubmit={onSave} className="space-y-3">
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Parker Salary"
            autoFocus
          />
          <AmountField label="Amount" value={amount} onChange={setAmount} />
          <TextField
            label="Day of month"
            type="number"
            min="1"
            max="31"
            value={day}
            onChange={(e) => setDay(e.target.value)}
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
