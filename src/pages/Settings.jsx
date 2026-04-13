import { useEffect, useMemo, useState } from 'react';
import { useMonth, computeMonthTotals } from '../hooks/useMonth.js';
import { useFixedBills } from '../hooks/useFixedBills.js';
import {
  currentMonthKey, monthLabel, toCents, formatDollars,
} from '../lib/money.js';
import {
  getCategoriesForMonth, upsertCategory, deleteCategory, setMonthMeta,
} from '../lib/firestore.js';
import { initializeMonth } from '../lib/monthInit.js';
import { CATEGORY_PALETTE } from '../config.js';
import FixedBillsManager from '../components/FixedBillsManager.jsx';
import MonthChart from '../components/MonthChart.jsx';

export default function Settings({ user, onClose }) {
  const monthKey = currentMonthKey();
  const monthData = useMonth(monthKey);
  const { bills } = useFixedBills();
  const totals = useMemo(() => computeMonthTotals(monthData), [monthData]);

  const needsSetup = !monthData.loading && !monthData.meta;

  return (
    <div className="min-h-full pb-16">
      <div className="sticky top-0 z-20 bg-bg/95 backdrop-blur border-b border-line px-5 py-3 flex items-center justify-between">
        <div>
          <div className="text-ink font-semibold">Settings</div>
          <div className="text-ink-faint text-xs">{monthLabel(monthKey)}</div>
        </div>
        <button onClick={onClose} className="text-accent text-sm press">Done</button>
      </div>

      <div className="px-5 pt-4 space-y-6">
        {needsSetup ? (
          <MonthSetupForm monthKey={monthKey} uid={user?.uid} bills={bills} />
        ) : (
          <>
            <StartingValueCard monthKey={monthKey} starting={totals.startingCents} />
            <MonthChart categoryStates={totals.categoryStates} />
            <CategoriesEditor
              monthKey={monthKey}
              categories={monthData.categories}
              totals={totals}
            />
            <FixedBillsManager bills={bills} categories={monthData.categories} />
          </>
        )}
      </div>
    </div>
  );
}

function StartingValueCard({ monthKey, starting }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState((starting / 100).toFixed(2));
  const [busy, setBusy] = useState(false);

  useEffect(() => { setValue((starting / 100).toFixed(2)); }, [starting]);

  async function save() {
    setBusy(true);
    try {
      await setMonthMeta(monthKey, { totalStartingValue: toCents(value) });
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-bg-raised border border-line rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-ink-muted text-xs uppercase tracking-widest">Starting balance</div>
          <div className="tnum text-ink text-2xl font-semibold mt-0.5">
            {formatDollars(starting)}
          </div>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="text-accent text-sm press">Edit</button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(false)} className="text-ink-muted text-sm press">Cancel</button>
            <button
              onClick={save}
              disabled={busy}
              className="bg-accent text-black font-semibold rounded-lg px-3 py-1.5 text-sm press"
            >
              Save
            </button>
          </div>
        )}
      </div>
      {editing && (
        <div className="relative mt-3">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted tnum">$</span>
          <input
            inputMode="decimal"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^0-9.]/g, ''))}
            className="w-full bg-bg border border-line rounded-lg pl-8 pr-4 py-3 text-ink tnum focus:border-accent focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}

function CategoriesEditor({ monthKey, categories, totals }) {
  const [adding, setAdding] = useState(false);
  const spentById = Object.fromEntries(totals.categoryStates.map((c) => [c.id, c.spent]));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-ink text-sm font-medium">Categories</div>
        <button onClick={() => setAdding(true)} className="text-accent text-sm press">+ Add</button>
      </div>
      <div className="space-y-2">
        {categories
          .slice()
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
          .map((c) => (
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
  );
}

function CategoryRow({ monthKey, cat, spent, draft, onDone }) {
  const [editing, setEditing] = useState(!!draft);
  const [name, setName] = useState(cat.name || '');
  const [budget, setBudget] = useState(((cat.maxBudget || 0) / 100).toFixed(0));
  const [color, setColor] = useState(cat.color || CATEGORY_PALETTE[0]);
  const [busy, setBusy] = useState(false);

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
    if (!confirm(`Delete category "${cat.name}"? Existing transactions will keep their category ID.`)) return;
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
        placeholder="Category name"
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

function MonthSetupForm({ monthKey, uid, bills }) {
  const [starting, setStarting] = useState('');
  const [cats, setCats] = useState([
    { name: 'Groceries', maxBudget: '800', color: CATEGORY_PALETTE[1] },
    { name: 'Gas', maxBudget: '200', color: CATEGORY_PALETTE[2] },
    { name: 'Dining', maxBudget: '250', color: CATEGORY_PALETTE[4] },
  ]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [carryOver, setCarryOver] = useState(false);

  // Attempt to carry forward last month's categories for convenience.
  useEffect(() => {
    const [y, m] = monthKey.split('-').map(Number);
    const prev = new Date(y, m - 2, 1);
    const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    getCategoriesForMonth(prevKey).then((prevCats) => {
      if (prevCats.length) {
        setCats(prevCats.map((c) => ({
          name: c.name,
          maxBudget: (c.maxBudget / 100).toFixed(0),
          color: c.color,
        })));
        setCarryOver(true);
      }
    }).catch(() => {});
  }, [monthKey]);

  function update(i, patch) {
    setCats((xs) => xs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function addRow() {
    setCats((xs) => [...xs, { name: '', maxBudget: '', color: CATEGORY_PALETTE[xs.length % CATEGORY_PALETTE.length] }]);
  }
  function removeRow(i) {
    setCats((xs) => xs.filter((_, idx) => idx !== i));
  }

  const fixedTotal = bills.reduce((a, b) => a + (b.amount || 0), 0);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    const clean = cats.filter((c) => c.name.trim());
    if (clean.length === 0) return setErr('Add at least one category.');
    setBusy(true);
    try {
      await initializeMonth({
        monthKey,
        totalStartingValueCents: toCents(starting),
        categories: clean.map((c) => ({
          name: c.name.trim(),
          maxBudget: toCents(c.maxBudget),
          color: c.color,
        })),
        uid,
      });
    } catch (e) {
      setErr(e?.message || 'Failed to initialize month.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="bg-bg-raised border border-line rounded-xl p-5">
        <div className="text-ink font-semibold">Set up {monthLabel(monthKey)}</div>
        <div className="text-ink-muted text-sm mt-1">
          {carryOver
            ? 'Loaded categories from last month — adjust budgets for this month.'
            : 'Define your starting balance and categories.'}
        </div>
      </div>

      <div>
        <div className="text-ink-muted text-xs mb-1.5 tracking-wide uppercase">Starting balance</div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted tnum">$</span>
          <input
            inputMode="decimal"
            value={starting}
            onChange={(e) => setStarting(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="0.00"
            className="w-full bg-bg-raised border border-line rounded-lg pl-8 pr-4 py-3 text-ink tnum focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-ink text-sm font-medium">Categories</div>
          <button type="button" onClick={addRow} className="text-accent text-sm press">+ Row</button>
        </div>
        {cats.map((c, i) => (
          <div key={i} className="bg-bg-raised border border-line rounded-xl p-3 space-y-2">
            <div className="flex gap-2">
              <input
                value={c.name}
                onChange={(e) => update(i, { name: e.target.value })}
                placeholder="Name"
                className="flex-1 bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:border-accent focus:outline-none"
              />
              <div className="relative w-28">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted tnum">$</span>
                <input
                  inputMode="decimal"
                  value={c.maxBudget}
                  onChange={(e) => update(i, { maxBudget: e.target.value.replace(/[^0-9.]/g, '') })}
                  placeholder="0"
                  className="w-full bg-bg border border-line rounded-lg pl-7 pr-2 py-2 text-ink tnum focus:border-accent focus:outline-none"
                />
              </div>
              <button type="button" onClick={() => removeRow(i)} className="text-ink-faint press px-2" aria-label="Remove">
                ×
              </button>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {CATEGORY_PALETTE.map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() => update(i, { color })}
                  className={`h-6 rounded border press ${c.color === color ? 'border-ink' : 'border-transparent'}`}
                  style={{ background: color }}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {bills.length > 0 && (
        <div className="bg-bg-raised border border-line rounded-xl p-4 text-sm">
          <div className="text-ink">
            Fixed bills will commit{' '}
            <span className="tnum font-semibold">{formatDollars(fixedTotal)}</span>{' '}
            across {bills.length} {bills.length === 1 ? 'bill' : 'bills'}.
          </div>
          <div className="text-ink-faint text-xs mt-1">
            Bills without a matching category this month will be flagged and skipped.
          </div>
        </div>
      )}

      {err && <div className="text-bad text-sm">{err}</div>}

      <button
        disabled={busy}
        className="w-full bg-accent text-black font-semibold rounded-lg py-3 press disabled:opacity-60"
      >
        {busy ? 'Setting up…' : 'Initialize month'}
      </button>
    </form>
  );
}
