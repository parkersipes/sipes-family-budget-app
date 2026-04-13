import { useState } from 'react';
import Sheet from './Sheet.jsx';
import { TextField, AmountField, SelectField, PrimaryButton } from './Field.jsx';
import { toCents, todayISO } from '../lib/money.js';
import { addTransaction } from '../lib/firestore.js';
import OverflowModal from './OverflowModal.jsx';

export default function AddTransactionSheet({
  open,
  onClose,
  monthKey,
  categories,
  categoryStates,
  uid,
  defaultCategoryId,
}) {
  const [vendor, setVendor] = useState('');
  const [categoryId, setCategoryId] = useState(defaultCategoryId || '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayISO());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [overflow, setOverflow] = useState(null);

  function reset() {
    setVendor('');
    setCategoryId(defaultCategoryId || '');
    setAmount('');
    setDescription('');
    setDate(todayISO());
    setErr('');
    setBusy(false);
    setOverflow(null);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    const cents = toCents(amount);
    if (!vendor.trim()) return setErr('Vendor is required.');
    if (!categoryId) return setErr('Pick a category.');
    if (cents <= 0) return setErr('Amount must be greater than zero.');

    const cat = categoryStates.find((c) => c.id === categoryId);
    if (cat && cents > cat.remaining) {
      setOverflow({ overdraft: cents - Math.max(cat.remaining, 0), cat });
      return;
    }
    await persist({ pulledFromCategoryId: null });
  }

  async function persist({ pulledFromCategoryId }) {
    setBusy(true);
    try {
      await addTransaction(monthKey, {
        vendor: vendor.trim(),
        categoryId,
        amount: toCents(amount),
        description: description.trim(),
        date,
        isFixed: false,
        pulledFromCategoryId: pulledFromCategoryId || null,
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
    <>
      <Sheet
        open={open}
        onClose={() => {
          reset();
          onClose();
        }}
        title="Add Transaction"
      >
        <form onSubmit={onSubmit} className="space-y-3 pb-4">
          <TextField
            label="Vendor"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="e.g. Kroger"
            autoFocus
          />
          <SelectField label="Category" value={categoryId} onChange={setCategoryId}>
            <option value="">Pick a category</option>
            {categories.map((c) => (
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
      </Sheet>
      {overflow && (
        <OverflowModal
          open
          onClose={() => setOverflow(null)}
          onConfirm={async (donorIds) => {
            await persist({ pulledFromCategoryId: donorIds[0] });
          }}
          overdraftCents={overflow.overdraft}
          targetCategory={overflow.cat}
          donorCandidates={categoryStates}
        />
      )}
    </>
  );
}
