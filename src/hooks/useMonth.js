import { useEffect, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';
import {
  monthDocRef,
  categoriesCol,
  transactionsCol,
  incomeCol,
} from '../lib/firestore.js';
import { isRecurringTx, effectiveAmount } from '../lib/money.js';

export function useMonth(monthKey) {
  const [meta, setMeta] = useState(null);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exists, setExists] = useState(true);

  useEffect(() => {
    if (!monthKey) return;
    setLoading(true);

    const unsubMeta = onSnapshot(monthDocRef(monthKey), (snap) => {
      setMeta(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setExists(snap.exists());
      setLoading(false);
    });
    const unsubCats = onSnapshot(categoriesCol(monthKey), (snap) => {
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsubTx = onSnapshot(transactionsCol(monthKey), (snap) => {
      setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsubIn = onSnapshot(incomeCol(monthKey), (snap) => {
      setIncome(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubMeta();
      unsubCats();
      unsubTx();
      unsubIn();
    };
  }, [monthKey]);

  return { meta, categories, transactions, income, loading, exists };
}

// Shared derivation used by every screen so numbers never disagree.
export function computeMonthTotals({ meta, categories, transactions, income }) {
  // Legacy: old data may carry totalStartingValue. Defaults to 0 under the new model.
  const startingCents = meta?.totalStartingValue ?? 0;

  const fixedIncomeCents = income
    .filter((i) => i.isFixed)
    .reduce((a, i) => a + (i.amount || 0), 0);
  const sideIncomeCents = income
    .filter((i) => !i.isFixed)
    .reduce((a, i) => a + (i.amount || 0), 0);
  const incomeCents = fixedIncomeCents + sideIncomeCents;

  const fixedBillsCents = transactions
    .filter((t) => isRecurringTx(t))
    .reduce((a, t) => a + effectiveAmount(t), 0);

  // Per-category spent, accounting for overflow pulls.
  // Recurring bills live outside the envelope system — skip them here.
  //   - transaction target absorbs (amount - sum(pulls))
  //   - each pull adds to its donor
  const spentByCategory = {};
  for (const t of transactions) {
    if (isRecurringTx(t)) continue;
    const pulls = Array.isArray(t.pulls) ? t.pulls : [];
    const pulledTotal = pulls.reduce((a, p) => a + (p.amount || 0), 0);
    const targetAmount = (t.amount || 0) - pulledTotal;
    if (t.categoryId) {
      spentByCategory[t.categoryId] = (spentByCategory[t.categoryId] || 0) + targetAmount;
    }
    for (const p of pulls) {
      if (!p.categoryId) continue;
      spentByCategory[p.categoryId] = (spentByCategory[p.categoryId] || 0) + (p.amount || 0);
    }
  }

  const totalBudgeted = categories.reduce((a, c) => a + (c.maxBudget || 0), 0);
  const totalSpent = transactions.reduce(
    (a, t) => a + (isRecurringTx(t) ? effectiveAmount(t) : (t.amount || 0)),
    0
  );
  const cashRemaining = startingCents + incomeCents - totalSpent;

  // "To work with" = net after bills, including any side income.
  const toWorkWith = fixedIncomeCents + sideIncomeCents - fixedBillsCents;
  // Unallocated = "to work with" minus what's assigned to envelopes. Positive means
  // slack you could add to an envelope or save; negative means over-allocation.
  const unallocatedCents = toWorkWith - totalBudgeted;
  // Envelope-only spend. Fixed bills are already separate from envelope budgets,
  // so totalBudgeted is envelope-only and we only need to strip fixed spending
  // from the numerator.
  const variableBudget = totalBudgeted;
  const variableSpent = Math.max(0, totalSpent - fixedBillsCents);
  const variableRemaining = variableBudget - variableSpent;

  const categoryStates = categories
    .slice()
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    .map((c) => {
      const spent = spentByCategory[c.id] || 0;
      const remaining = (c.maxBudget || 0) - spent;
      const pct = c.maxBudget ? Math.min(100, (spent / c.maxBudget) * 100) : 0;
      let status = 'ok';
      if (pct > 90) status = 'bad';
      else if (pct > 70) status = 'warn';
      return { ...c, spent, remaining, pct, status };
    });

  return {
    startingCents,
    incomeCents,
    fixedIncomeCents,
    sideIncomeCents,
    fixedBillsCents,
    toWorkWith,
    unallocatedCents,
    totalBudgeted,
    totalSpent,
    cashRemaining,
    variableBudget,
    variableSpent,
    variableRemaining,
    categoryStates,
  };
}
