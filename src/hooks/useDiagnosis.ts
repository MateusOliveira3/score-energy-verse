import { useEffect, useMemo, useState } from 'react';
import { fetchDiagnosis, type DiagnosisItem } from '@/services/diagnosis';

export function useDiagnosis(userId?: string) {
  const [data, setData] = useState<DiagnosisItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    let alive = true;
    async function run() {
      if (!userId) return;
      setLoading(true);
      setError(null);
      try {
        const items = await fetchDiagnosis(userId);
        if (alive) setData(items);
      } catch (e: any) {
        if (alive) setError(e?.message || 'Erro ao carregar análises');
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => { alive = false; };
  }, [userId]);

  // índices úteis para acesso rápido por (month,year)
  const byMonthYear = useMemo(() => {
    const map = new Map<string, DiagnosisItem[]>();
    for (const d of data) {
      const key = `${d.year}-${d.month}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    for (const [key, arr] of map) {
      arr.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      map.set(key, arr);
    }
    return map;
  }, [data]);

  return { data, byMonthYear, loading, error };
}
