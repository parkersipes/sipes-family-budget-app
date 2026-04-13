import { useEffect, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { fixedBillsCol } from '../lib/firestore.js';

export function useFixedBills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(fixedBillsCol(), (snap) => {
      setBills(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  return { bills, loading };
}
