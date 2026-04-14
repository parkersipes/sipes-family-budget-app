import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { TextField, AmountField, PrimaryButton } from '../components/Field.jsx';
import { toCents, todayISO, currentMonthKey, monthLabel } from '../lib/money.js';
import { addIncome } from '../lib/firestore.js';

export default function AddIncomePage({ user }) {
  const nav = useNavigate();
  const params = useParams();
  const monthKey = params.monthKey || currentMonthKey();

  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

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
        isFixed: false,
        createdBy: user?.uid || null,
      });
      nav(-1);
    } catch (e) {
      setErr(e?.message || 'Failed to save.');
      setBusy(false);
    }
  }

  return (
    <div className="min-h-full pb-10">
      <PageHeader title="Add Side Income" subtitle={monthLabel(monthKey)} />
      <form onSubmit={onSubmit} className="px-5 pt-4 space-y-3">
        <div className="text-ink-muted text-sm bg-bg-raised border border-line rounded-lg p-3">
          For a side hustle or one-off earning. Recurring salary lives in{' '}
          <span className="text-ink">Settings → Income</span>.
        </div>
        <TextField
          label="Source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="e.g. Marketplace sale"
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
    </div>
  );
}
