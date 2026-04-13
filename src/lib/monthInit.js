import { getDocs, writeBatch, serverTimestamp, doc } from 'firebase/firestore';
import { db } from './firebase.js';
import {
  monthDocRef,
  categoriesCol,
  transactionsCol,
  fixedBillsCol,
  getMonthMeta,
} from './firestore.js';

// Initialize a month: write meta, categories, and apply fixed bills idempotently.
// If the month already exists and fixedBillsApplied=true, this is a no-op.
export async function initializeMonth({
  monthKey,
  totalStartingValueCents,
  categories,
  uid,
}) {
  const existing = await getMonthMeta(monthKey);
  const batch = writeBatch(db);

  if (!existing) {
    batch.set(monthDocRef(monthKey), {
      totalStartingValue: totalStartingValueCents ?? 0,
      createdAt: serverTimestamp(),
      fixedBillsApplied: false,
      createdBy: uid || null,
    });
  } else if (totalStartingValueCents != null) {
    batch.set(monthDocRef(monthKey), { totalStartingValue: totalStartingValueCents }, { merge: true });
  }

  if (categories && categories.length) {
    for (const c of categories) {
      const ref = c.id ? doc(categoriesCol(monthKey), c.id) : doc(categoriesCol(monthKey));
      batch.set(ref, {
        name: c.name,
        maxBudget: c.maxBudget,
        color: c.color,
      });
    }
  }

  await batch.commit();

  await applyFixedBillsForMonth({ monthKey, uid });
}

// Applies fixed bills as pre-logged transactions for the given month.
// Safe to call repeatedly — guarded by meta.fixedBillsApplied.
export async function applyFixedBillsForMonth({ monthKey, uid }) {
  const meta = await getMonthMeta(monthKey);
  if (!meta) return { applied: 0, skipped: 0, reason: 'no-meta' };
  if (meta.fixedBillsApplied) return { applied: 0, skipped: 0, reason: 'already-applied' };

  const [billsSnap, categoriesSnap] = await Promise.all([
    getDocs(fixedBillsCol()),
    getDocs(categoriesCol(monthKey)),
  ]);

  const catIds = new Set(categoriesSnap.docs.map((d) => d.id));
  const bills = billsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const [y, m] = monthKey.split('-').map(Number);
  const batch = writeBatch(db);
  let applied = 0;
  let skipped = 0;

  for (const bill of bills) {
    if (!catIds.has(bill.categoryId)) {
      // Category was renamed or deleted — don't silently create orphans.
      skipped++;
      continue;
    }
    const day = Math.min(Math.max(bill.dueDay || 1, 1), 28);
    const date = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const txRef = doc(transactionsCol(monthKey));
    batch.set(txRef, {
      vendor: bill.name,
      categoryId: bill.categoryId,
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

  return { applied, skipped };
}
