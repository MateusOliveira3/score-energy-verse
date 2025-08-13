import { useEffect, useState } from 'react';
import { fetchHistory, InvoiceLite, DiagnosisLite } from '@/services/diagnosis';

export function useHistory(userId?: string) {
  const [data, setData] = useState<{ invoices: InvoiceLite[]; diagnosis: DiagnosisLite[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchHistory(userId)
      .then(setData)
      .catch(e => setErr(e.message || 'Falha ao carregar histórico'))
      .finally(() => setLoading(false));
  }, [userId]);

  return { data, loading, error };
}
