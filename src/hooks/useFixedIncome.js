import { useEffect, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { fixedIncomeCol } from '../lib/firestore.js';

export function useFixedIncome() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(fixedIncomeCol(), (snap) => {
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  return { entries, loading };
}
