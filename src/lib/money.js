// Internal money is always integer cents. Display-only formatting lives here.

export function toCents(input) {
  if (typeof input === 'number') return Math.round(input * 100);
  if (typeof input !== 'string') return 0;
  const cleaned = input.replace(/[^0-9.\-]/g, '');
  if (!cleaned) return 0;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function formatDollars(cents, { sign = false } = {}) {
  const n = (cents ?? 0) / 100;
  const s = n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
  if (sign && n > 0) return `+${s}`;
  return s;
}

export function formatCompact(cents) {
  const n = (cents ?? 0) / 100;
  if (Math.abs(n) >= 1000) {
    return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  }
  return `$${n.toFixed(0)}`;
}

export function currentMonthKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function monthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function shiftMonth(key, delta) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return currentMonthKey(d);
}

export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// A transaction is a recurring bill if it was auto-generated from a household
// recurring bill entry. `isRecurring` is the new flag; `isFixed` is the legacy
// equivalent still present on older documents.
export function isRecurringTx(t) {
  return !!(t && (t.isRecurring || t.isFixed));
}

// Effective displayed amount for a recurring-bill transaction. For variable
// bills, we prefer the reconciled actual; otherwise the estimate; otherwise
// the raw amount field.
export function effectiveAmount(t) {
  if (!t) return 0;
  if (t.actualAmount != null) return t.actualAmount;
  if (t.estimatedAmount != null) return t.estimatedAmount;
  return t.amount || 0;
}
