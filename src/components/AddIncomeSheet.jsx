import { useState } from 'react';
import Sheet from './Sheet.jsx';
import { TextField, AmountField, PrimaryButton } from './Field.jsx';
import { toCents, todayISO } from '../lib/money.js';
import { addIncome } from '../lib/firestore.js';

export default function AddIncomeSheet({ open, onClose, monthKey, uid }) {
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  function reset() {
    setSource('');
    setAmount('');
    setDate(todayISO());
    setErr('');
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    const cents = toCents(amount);
    if (!source.trim()) return setErr('Source is required.');
    if (cents <= 0) return setErr('Amount must be greater than zero.');
    setBusy(true);
    try {
      await addIncome(monthKey, {
        source: source.trim(),
        amount: cents,
        date,
        createdBy: uid || null,
      });
      reset();
      onClose();
    } catch (e) {
      setErr(e?.message || 'Failed to save.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Add Income"
    >
      <form onSubmit={onSubmit} className="space-y-3 pb-4">
        <TextField
          label="Source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="e.g. Parker paycheck"
          autoFocus
        />
        <AmountField label="Amount" value={amount} onChange={setAmount} />
        <TextField
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        {err && <div className="text-bad text-sm">{err}</div>}
        <PrimaryButton disabled={busy}>{busy ? 'Saving…' : 'Save'}</PrimaryButton>
      </form>
    </Sheet>
  );
}
