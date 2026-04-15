import { useEffect, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { monthClosesCol } from '../lib/firestore.js';

export function useMonthCloses() {
  const [closes, setCloses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(monthClosesCol(), (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.monthId || b.id || '').localeCompare(a.monthId || a.id || ''));
      setCloses(list);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { closes, loading };
}
