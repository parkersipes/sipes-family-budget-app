import { useEffect, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';
import {
  monthDocRef,
  categoriesCol,
  transactionsCol,
  incomeCol,
} from '../lib/firestore.js';

export function useMonth(monthKey) {
  const [meta, setMeta] = useState(null);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!monthKey) return;
    setLoading(true);

    const unsubMeta = onSnapshot(monthDocRef(monthKey), (snap) => {
      setMeta(snap.exists() ? { id: snap.id, ...snap.data() } : null);
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

  return { meta, categories, transactions, income, loading };
}

// Derived math lives here so every screen agrees.
export function computeMonthTotals({ meta, categories, transactions, income }) {
  const startingCents = meta?.totalStartingValue ?? 0;
  const incomeCents = income.reduce((a, i) => a + (i.amount || 0), 0);
  const spentByCategory = {};
  for (const t of transactions) {
    spentByCategory[t.categoryId] = (spentByCategory[t.categoryId] || 0) + (t.amount || 0);
  }
  const totalBudgeted = categories.reduce((a, c) => a + (c.maxBudget || 0), 0);
  const totalSpent = transactions.reduce((a, t) => a + (t.amount || 0), 0);
  const cashRemaining = startingCents + incomeCents - totalSpent;

  const categoryStates = categories
    .slice()
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    .map((c) => {
      const spent = spentByCategory[c.id] || 0;
      const fixedSpent = transactions
        .filter((t) => t.categoryId === c.id && t.isFixed)
        .reduce((a, t) => a + (t.amount || 0), 0);
      const remaining = (c.maxBudget || 0) - spent;
      const pct = c.maxBudget ? Math.min(100, (spent / c.maxBudget) * 100) : 0;
      let status = 'ok';
      if (pct > 90) status = 'bad';
      else if (pct > 70) status = 'warn';
      return { ...c, spent, fixedSpent, remaining, pct, status };
    });

  return {
    startingCents,
    incomeCents,
    totalBudgeted,
    totalSpent,
    cashRemaining,
    categoryStates,
  };
}
