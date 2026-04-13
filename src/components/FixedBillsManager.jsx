import { useState } from 'react';
import { formatDollars } from '../lib/money.js';
import { deleteFixedBill } from '../lib/firestore.js';
import AddFixedBillSheet from './AddFixedBillSheet.jsx';

export default function FixedBillsManager({ bills, categories }) {
  const [editing, setEditing] = useState(null); // null = closed, {} = new, bill = edit
  const catById = Object.fromEntries(categories.map((c) => [c.id, c]));

  const sorted = bills.slice().sort((a, b) => (a.dueDay || 0) - (b.dueDay || 0));

  async function onDelete(bill) {
    if (!confirm(`Delete "${bill.name}"? It will no longer be auto-applied to new months.`)) return;
    await deleteFixedBill(bill.id);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-ink text-sm font-medium">Fixed Bills</div>
        <button
          onClick={() => setEditing({})}
          className="text-accent text-sm press"
        >
          + Add
        </button>
      </div>
      {sorted.length === 0 && (
        <div className="text-ink-muted text-sm border border-dashed border-line rounded-lg p-4 text-center">
          No fixed bills yet.
        </div>
      )}
      <div className="divide-y divide-line border border-line rounded-xl bg-bg-raised">
        {sorted.map((b) => {
          const cat = catById[b.categoryId];
          const orphan = !cat;
          return (
            <div key={b.id} className="flex items-center justify-between px-4 py-3 gap-3">
              <button
                onClick={() => setEditing(b)}
                className="flex items-center gap-2.5 min-w-0 flex-1 text-left press"
              >
                {cat ? (
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: cat.color }}
                  />
                ) : (
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-bad flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="text-ink truncate">{b.name}</div>
                  <div className="text-ink-faint text-xs truncate">
                    {orphan ? (
                      <span className="text-bad">⚠ No matching category for this month.</span>
                    ) : (
                      <>
                        {cat.name} · day {b.dueDay || 1}
                      </>
                    )}
                  </div>
                </div>
              </button>
              <div className="flex items-center gap-3">
                <div className="tnum text-ink">{formatDollars(b.amount)}</div>
                <button
                  onClick={() => onDelete(b)}
                  className="text-ink-faint press p-1"
                  aria-label="Delete"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <AddFixedBillSheet
        open={editing != null}
        onClose={() => setEditing(null)}
        bill={editing && editing.id ? editing : null}
        categories={categories}
      />
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
