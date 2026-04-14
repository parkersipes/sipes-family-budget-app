import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import { useMonth, computeMonthTotals } from '../hooks/useMonth.js';
import { currentMonthKey, formatDollars, toCents } from '../lib/money.js';
import { upsertCategory, deleteCategory } from '../lib/firestore.js';
import { CATEGORY_PALETTE } from '../config.js';

export default function SettingsCategories() {
  const monthKey = currentMonthKey();
  const monthData = useMonth(monthKey);
  const totals = useMemo(() => computeMonthTotals(monthData), [monthData]);
  const [adding, setAdding] = useState(false);

  const spentById = Object.fromEntries(totals.categoryStates.map((c) => [c.id, c.spent]));
  const sorted = monthData.categories.slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  return (
    <div className="min-h-full pb-10">
      <PageHeader
        title="Envelopes"
        subtitle="Roll over every month with last month's budget"
        backTo="/settings"
        right={
          <button onClick={() => setAdding(true)} className="text-accent text-sm press">
            + Add
          </button>
        }
      />
      <div className="px-5 pt-4 space-y-3">
        <div className="bg-bg-raised border border-line rounded-xl p-4">
          <div className="text-ink-muted text-[10px] uppercase tracking-widest">Allocated this month</div>
          <div className="tnum text-3xl font-semibold text-ink mt-1">
            {formatDollars(totals.totalBudgeted)}
          </div>
          <div className="text-ink-faint text-xs mt-1">
            {sorted.length} {sorted.length === 1 ? 'envelope' : 'envelopes'}
          </div>
        </div>
        <div className="space-y-2">
          {sorted.map((c) => (
            <CategoryRow
              key={c.id}
              monthKey={monthKey}
              cat={c}
              spent={spentById[c.id] || 0}
            />
          ))}
          {adding && (
            <CategoryRow
              monthKey={monthKey}
              cat={{ name: '', maxBudget: 0, color: CATEGORY_PALETTE[0] }}
              spent={0}
              draft
              onDone={() => setAdding(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryRow({ monthKey, cat, spent, draft, onDone }) {
  const [editing, setEditing] = useState(!!draft);
  const [name, setName] = useState(cat.name || '');
  const [budget, setBudget] = useState(((cat.maxBudget || 0) / 100).toFixed(0));
  const [color, setColor] = useState(cat.color || CATEGORY_PALETTE[0]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!draft) {
      setName(cat.name || '');
      setBudget(((cat.maxBudget || 0) / 100).toFixed(0));
      setColor(cat.color || CATEGORY_PALETTE[0]);
    }
  }, [cat, draft]);

  async function save() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await upsertCategory(monthKey, {
        id: draft ? undefined : cat.id,
        name: name.trim(),
        maxBudget: toCents(budget),
        color,
      });
      setEditing(false);
      onDone?.();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete the "${cat.name}" envelope? Past transactions will still reference it.`)) return;
    await deleteCategory(monthKey, cat.id);
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="w-full bg-bg-raised border border-line rounded-xl p-4 text-left press"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="inline-block w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />
            <span className="text-ink truncate">{cat.name}</span>
          </div>
          <div className="text-right">
            <div className="tnum text-ink text-sm">{formatDollars(cat.maxBudget)}</div>
            <div className="tnum text-ink-faint text-xs">spent {formatDollars(spent)}</div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="bg-bg-raised border border-line rounded-xl p-4 space-y-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Envelope name"
        className="w-full bg-bg border border-line rounded-lg px-3 py-2.5 text-ink focus:border-accent focus:outline-none"
      />
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted tnum">$</span>
        <input
          inputMode="decimal"
          value={budget}
          onChange={(e) => setBudget(e.target.value.replace(/[^0-9.]/g, ''))}
          placeholder="0"
          className="w-full bg-bg border border-line rounded-lg pl-7 pr-3 py-2.5 text-ink tnum focus:border-accent focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-6 gap-2">
        {CATEGORY_PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className={`h-8 rounded-lg border press ${color === c ? 'border-ink' : 'border-transparent'}`}
            style={{ background: c }}
            aria-label={`Color ${c}`}
          />
        ))}
      </div>
      <div className="flex gap-2">
        {!draft && (
          <button onClick={remove} className="text-bad text-sm press px-2">Delete</button>
        )}
        <div className="flex-1" />
        <button
          onClick={() => { setEditing(false); onDone?.(); }}
          className="text-ink-muted text-sm press px-2"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={busy}
          className="bg-accent text-black font-semibold rounded-lg px-3 py-1.5 text-sm press"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
