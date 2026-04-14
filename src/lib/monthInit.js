import { getDocs, writeBatch, serverTimestamp, doc } from 'firebase/firestore';
import { db } from './firebase.js';
import {
  monthDocRef,
  categoriesCol,
  transactionsCol,
  incomeCol,
  fixedBillsCol,
  fixedIncomeCol,
  getMonthMeta,
} from './firestore.js';
import { shiftMonth, currentMonthKey } from './money.js';

// Main entry point: ensure the month exists and has been rolled over from the
// prior month (categories copied forward + fixed income and fixed bills applied).
// Idempotent — guarded by meta.initialized.
export async function ensureMonthInitialized({ monthKey, uid }) {
  const meta = await getMonthMeta(monthKey);
  if (meta?.initialized) return { status: 'already-initialized' };

  if (!meta) {
    // Create the month doc first so we can write into its subcollections.
    const batch0 = writeBatch(db);
    batch0.set(monthDocRef(monthKey), {
      createdAt: serverTimestamp(),
      createdBy: uid || null,
      initialized: false,
    });
    await batch0.commit();
  }

  // 1. Roll over categories from prior month (if any).
  await rolloverCategoriesFromPreviousMonth({ monthKey });

  // 2. Apply fixed income events for this month.
  await applyFixedIncomeForMonth({ monthKey, uid });

  // 3. Apply fixed bills as transactions for this month.
  await applyFixedBillsForMonth({ monthKey, uid });

  // 4. Flip the initialized flag so this never runs twice.
  const finalize = writeBatch(db);
  finalize.set(monthDocRef(monthKey), { initialized: true }, { merge: true });
  await finalize.commit();

  return { status: 'initialized' };
}

async function rolloverCategoriesFromPreviousMonth({ monthKey }) {
  const existing = await getDocs(categoriesCol(monthKey));
  if (!existing.empty) return;

  // Walk back up to 12 months to find the most recent month with envelopes.
  // This handles the case where the user jumps several months ahead.
  let prevKey = monthKey;
  for (let i = 0; i < 12; i++) {
    prevKey = shiftMonth(prevKey, -1);
    const prevCats = await getDocs(categoriesCol(prevKey));
    if (!prevCats.empty) {
      const batch = writeBatch(db);
      for (const d of prevCats.docs) {
        const c = d.data();
        const ref = doc(categoriesCol(monthKey));
        batch.set(ref, {
          name: c.name,
          maxBudget: c.maxBudget,
          color: c.color,
        });
      }
      await batch.commit();
      return;
    }
  }
  // First-ever month — user will add envelopes manually.
}

async function applyFixedIncomeForMonth({ monthKey, uid }) {
  const meta = await getMonthMeta(monthKey);
  if (meta?.fixedIncomeApplied) return;

  const snap = await getDocs(fixedIncomeCol());
  const [y, m] = monthKey.split('-').map(Number);
  const batch = writeBatch(db);

  for (const d of snap.docs) {
    const entry = d.data();
    const day = Math.min(Math.max(entry.dayOfMonth || 1, 1), 28);
    const date = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const ref = doc(incomeCol(monthKey));
    batch.set(ref, {
      source: entry.name,
      amount: entry.amount,
      date,
      isFixed: true,
      fixedIncomeId: d.id,
      createdBy: uid || null,
      createdAt: serverTimestamp(),
    });
  }
  batch.set(monthDocRef(monthKey), { fixedIncomeApplied: true }, { merge: true });
  await batch.commit();
}

// Reconcile a month's fixed bill transactions and fixed income events with the
// current household-level lists. Runs for the current month and any future
// month (you may want to preview an upcoming month's budget). Past months stay
// frozen. Safe to call repeatedly — only writes when diffs exist.
export async function syncCurrentMonthFixedItems({ monthKey, uid }) {
  if (monthKey < currentMonthKey()) return { writes: 0, reason: 'past-month' };
  const meta = await getMonthMeta(monthKey);
  if (!meta?.initialized) return { writes: 0, reason: 'not-initialized' };

  const [billsSnap, incomeSnap, txSnap, inSnap] = await Promise.all([
    getDocs(fixedBillsCol()),
    getDocs(fixedIncomeCol()),
    getDocs(transactionsCol(monthKey)),
    getDocs(incomeCol(monthKey)),
  ]);

  const billsById = new Map(billsSnap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]));
  const incomeById = new Map(incomeSnap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]));

  const [y, m] = monthKey.split('-').map(Number);
  const monthPrefix = `${y}-${String(m).padStart(2, '0')}`;
  const batch = writeBatch(db);
  let writes = 0;

  // --- Fixed bills -> transactions
  const existingByBillId = new Map();
  for (const d of txSnap.docs) {
    const t = d.data();
    if (!t.isFixed) continue;
    if (!t.fixedBillId || !billsById.has(t.fixedBillId)) {
      batch.delete(d.ref);
      writes++;
    } else {
      existingByBillId.set(t.fixedBillId, { ref: d.ref, data: t });
    }
  }
  for (const [billId, bill] of billsById) {
    const day = Math.min(Math.max(bill.dueDay || 1, 1), 28);
    const date = `${monthPrefix}-${String(day).padStart(2, '0')}`;
    const existing = existingByBillId.get(billId);
    if (existing) {
      const changed =
        existing.data.amount !== bill.amount ||
        existing.data.vendor !== bill.name ||
        existing.data.date !== date ||
        existing.data.categoryId != null;
      if (changed) {
        batch.update(existing.ref, {
          amount: bill.amount,
          vendor: bill.name,
          date,
          categoryId: null,
        });
        writes++;
      }
    } else {
      const ref = doc(transactionsCol(monthKey));
      batch.set(ref, {
        vendor: bill.name,
        categoryId: null,
        amount: bill.amount,
        description: '',
        date,
        isFixed: true,
        fixedBillId: billId,
        createdBy: uid || null,
        createdAt: serverTimestamp(),
      });
      writes++;
    }
  }

  // --- Fixed income -> incomeEvents
  const existingByIncomeId = new Map();
  for (const d of inSnap.docs) {
    const i = d.data();
    if (!i.isFixed) continue;
    if (!i.fixedIncomeId || !incomeById.has(i.fixedIncomeId)) {
      batch.delete(d.ref);
      writes++;
    } else {
      existingByIncomeId.set(i.fixedIncomeId, { ref: d.ref, data: i });
    }
  }
  for (const [entryId, entry] of incomeById) {
    const day = Math.min(Math.max(entry.dayOfMonth || 1, 1), 28);
    const date = `${monthPrefix}-${String(day).padStart(2, '0')}`;
    const existing = existingByIncomeId.get(entryId);
    if (existing) {
      const changed =
        existing.data.amount !== entry.amount ||
        existing.data.source !== entry.name ||
        existing.data.date !== date;
      if (changed) {
        batch.update(existing.ref, {
          amount: entry.amount,
          source: entry.name,
          date,
        });
        writes++;
      }
    } else {
      const ref = doc(incomeCol(monthKey));
      batch.set(ref, {
        source: entry.name,
        amount: entry.amount,
        date,
        isFixed: true,
        fixedIncomeId: entryId,
        createdBy: uid || null,
        createdAt: serverTimestamp(),
      });
      writes++;
    }
  }

  if (writes > 0) await batch.commit();
  return { writes };
}

// Exported so the dashboard can self-heal if a month was created under the old
// flow without this flag set. Safe to call repeatedly.
export async function applyFixedBillsForMonth({ monthKey, uid }) {
  const meta = await getMonthMeta(monthKey);
  if (!meta) return { applied: 0, reason: 'no-meta' };
  if (meta.fixedBillsApplied) return { applied: 0, reason: 'already-applied' };

  const billsSnap = await getDocs(fixedBillsCol());
  const bills = billsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const [y, m] = monthKey.split('-').map(Number);
  const batch = writeBatch(db);
  let applied = 0;

  for (const bill of bills) {
    const day = Math.min(Math.max(bill.dueDay || 1, 1), 28);
    const date = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const txRef = doc(transactionsCol(monthKey));
    batch.set(txRef, {
      vendor: bill.name,
      categoryId: null,
      amount: bill.amount,
      description: '',
      date,
      isFixed: true,
      fixedBillId: bill.id,
      createdBy: uid || null,
      createdAt: serverTimestamp(),
    });
    applied++;
  }

  batch.set(monthDocRef(monthKey), { fixedBillsApplied: true }, { merge: true });
  await batch.commit();

  return { applied };
}
