import { useEffect, useState } from 'react';
import { fetchLastInvoice, LastInvoiceDTO } from '@/services/diagnosis';

export function useLastInvoice(userId?: string) {
  const [data, setData] = useState<LastInvoiceDTO | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancel = false;
    async function run() {
      if (!userId) return;
      setLoading(true);
      try {
        const d = await fetchLastInvoice(userId);
        if (!cancel) setData(d);
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    run();
    return () => { cancel = true; };
  }, [userId]);

  return { data, loading };
}
