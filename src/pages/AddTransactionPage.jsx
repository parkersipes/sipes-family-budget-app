import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { TextField, AmountField, SelectField, PrimaryButton } from '../components/Field.jsx';
import { toCents, todayISO, currentMonthKey, monthLabel } from '../lib/money.js';
import { addTransaction } from '../lib/firestore.js';
import { useMonth, computeMonthTotals } from '../hooks/useMonth.js';
import OverflowModal from '../components/OverflowModal.jsx';

export default function AddTransactionPage({ user }) {
  const nav = useNavigate();
  const params = useParams();
  const monthKey = params.monthKey || currentMonthKey();
  const monthData = useMonth(monthKey);
  const totals = useMemo(() => computeMonthTotals(monthData), [monthData]);

  const [vendor, setVendor] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayISO());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [overflow, setOverflow] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    const cents = toCents(amount);
    if (!vendor.trim()) return setErr('Vendor is required.');
    if (!categoryId) return setErr('Pick an envelope.');
    if (cents <= 0) return setErr('Amount must be greater than zero.');

    const cat = totals.categoryStates.find((c) => c.id === categoryId);
    if (cat && cents > cat.remaining) {
      const overdraft = cents - Math.max(cat.remaining, 0);
      setOverflow({ overdraft, cat });
      return;
    }
    await persist([]);
  }

  async function persist(pulls) {
    setBusy(true);
    try {
      await addTransaction(monthKey, {
        vendor: vendor.trim(),
        categoryId,
        amount: toCents(amount),
        description: description.trim(),
        date,
        isFixed: false,
        pulls,
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
      <PageHeader
        title="Add Transaction"
        subtitle={monthLabel(monthKey)}
        backTo={-1}
      />
      <form onSubmit={onSubmit} className="px-5 pt-4 space-y-3">
        <TextField
          label="Vendor"
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
          placeholder="e.g. Kroger"
          autoFocus
        />
        <SelectField label="Envelope" value={categoryId} onChange={setCategoryId}>
          <option value="">Pick an envelope</option>
          {monthData.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>
        <AmountField label="Amount" value={amount} onChange={setAmount} />
        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
      {overflow && (
        <OverflowModal
          open
          onClose={() => setOverflow(null)}
          onConfirm={(pulls) => persist(pulls)}
          overdraftCents={overflow.overdraft}
          targetCategory={overflow.cat}
          donorCandidates={totals.categoryStates}
        />
      )}
    </div>
  );
}
