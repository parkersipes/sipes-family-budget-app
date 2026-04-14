import { useEffect, useState } from 'react';
import Sheet from './Sheet.jsx';
import { TextField, AmountField, PrimaryButton } from './Field.jsx';
import { toCents, formatDollars } from '../lib/money.js';
import { addFixedBill, updateFixedBill } from '../lib/firestore.js';

export default function AddFixedBillSheet({ open, onClose, bill }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('1');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (bill) {
      setName(bill.name || '');
      setAmount(((bill.amount || 0) / 100).toString());
      setDueDay(String(bill.dueDay || 1));
    } else {
      setName('');
      setAmount('');
      setDueDay('1');
    }
    setErr('');
  }, [bill, open]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    const cents = toCents(amount);
    if (!name.trim()) return setErr('Name is required.');
    if (cents <= 0) return setErr('Amount must be greater than zero.');
    const day = Math.min(Math.max(parseInt(dueDay, 10) || 1, 1), 31);
    setBusy(true);
    try {
      const payload = { name: name.trim(), amount: cents, dueDay: day };
      if (bill?.id) await updateFixedBill(bill.id, payload);
      else await addFixedBill(payload);
      onClose();
    } catch (e) {
      setErr(e?.message || 'Failed to save.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={bill ? 'Edit Fixed Bill' : 'Add Fixed Bill'}>
      <form onSubmit={onSubmit} className="space-y-3 pb-4">
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Mortgage"
          autoFocus
        />
        <AmountField label="Amount" value={amount} onChange={setAmount} />
        <TextField
          label="Due day of month"
          type="number"
          min="1"
          max="31"
          value={dueDay}
          onChange={(e) => setDueDay(e.target.value)}
        />
        <div className="text-ink-faint text-xs">
          Auto-deducted from income each month as{' '}
          <span className="tnum">{formatDollars(toCents(amount))}</span>. Fixed bills aren't tied to envelopes.
        </div>
        {err && <div className="text-bad text-sm">{err}</div>}
        <PrimaryButton disabled={busy}>{busy ? 'Saving…' : 'Save'}</PrimaryButton>
      </form>
    </Sheet>
  );
}
