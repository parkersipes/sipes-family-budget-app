import { useEffect, useState } from 'react';
import Sheet from './Sheet.jsx';
import { TextField, AmountField, PrimaryButton } from './Field.jsx';
import { toCents, formatDollars } from '../lib/money.js';
import { addFixedBill, updateFixedBill } from '../lib/firestore.js';

export default function AddFixedBillSheet({ open, onClose, bill }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('1');
  const [amountType, setAmountType] = useState('fixed');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (bill) {
      setName(bill.name || '');
      setAmount(((bill.amount || 0) / 100).toString());
      setDueDay(String(bill.dueDay || 1));
      setAmountType(bill.amountType === 'variable' ? 'variable' : 'fixed');
    } else {
      setName('');
      setAmount('');
      setDueDay('1');
      setAmountType('fixed');
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
      const payload = {
        name: name.trim(),
        amount: cents,
        dueDay: day,
        amountType,
      };
      if (bill?.id) await updateFixedBill(bill.id, payload);
      else await addFixedBill(payload);
      onClose();
    } catch (e) {
      setErr(e?.message || 'Failed to save.');
    } finally {
      setBusy(false);
    }
  }

  const amountLabel = amountType === 'variable' ? 'Estimated amount' : 'Amount';

  return (
    <Sheet open={open} onClose={onClose} title={bill ? 'Edit Recurring Bill' : 'Add Recurring Bill'}>
      <form onSubmit={onSubmit} className="space-y-3 pb-4">
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Mortgage"
          autoFocus
        />
        <AmountTypeToggle value={amountType} onChange={setAmountType} />
        <AmountField label={amountLabel} value={amount} onChange={setAmount} />
        <TextField
          label="Due day of month"
          type="number"
          min="1"
          max="31"
          value={dueDay}
          onChange={(e) => setDueDay(e.target.value)}
        />
        <div className="text-ink-faint text-xs">
          {amountType === 'variable' ? (
            <>
              Posts each month at an estimate of{' '}
              <span className="tnum">{formatDollars(toCents(amount))}</span>. You'll reconcile with
              the real bill when it arrives.
            </>
          ) : (
            <>
              Posts each month at{' '}
              <span className="tnum">{formatDollars(toCents(amount))}</span>. Recurring bills aren't
              tied to envelopes.
            </>
          )}
        </div>
        {err && <div className="text-bad text-sm">{err}</div>}
        <PrimaryButton disabled={busy}>{busy ? 'Saving…' : 'Save'}</PrimaryButton>
      </form>
    </Sheet>
  );
}

function AmountTypeToggle({ value, onChange }) {
  return (
    <div>
      <div className="text-ink-muted text-xs mb-1.5 tracking-wide uppercase">Amount type</div>
      <div className="grid grid-cols-2 gap-2">
        <Option
          active={value === 'fixed'}
          onClick={() => onChange('fixed')}
          title="Fixed"
          sub="Same each month"
        />
        <Option
          active={value === 'variable'}
          onClick={() => onChange('variable')}
          title="Variable"
          sub="Reconcile monthly"
        />
      </div>
    </div>
  );
}

function Option({ active, onClick, title, sub }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-lg border px-3 py-2.5 press ${
        active ? 'border-accent bg-bg-elevated' : 'border-line bg-bg'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
            active ? 'border-accent' : 'border-line'
          }`}
        >
          {active && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
        </span>
        <span className={`text-sm font-medium ${active ? 'text-ink' : 'text-ink-muted'}`}>
          {title}
        </span>
      </div>
      <div className="text-ink-faint text-xs mt-0.5 pl-5">{sub}</div>
    </button>
  );
}
