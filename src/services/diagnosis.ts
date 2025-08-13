export type DiagnosisItem = {
  id: string;
  user_id: string;
  month: string;
  year: string;
  consumption_kwh: number;
  total_value_brl: number;
  score_total: number;
  breakdown: Record<string, number>;
  tips: string[];
  created_at: string;
};

export async function fetchDiagnosis(userId: string): Promise<DiagnosisItem[]> {
  if (!userId) throw new Error('userId é obrigatório');
  const res = await fetch(`/api/users/${encodeURIComponent(userId)}/diagnosis`, {
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || 'Falha ao carregar histórico de análises');
  }
  return res.json();
}

export function pickLatestForMonthYear(items: DiagnosisItem[], month: string, year: string) {
  const filtered = items.filter(d => d.month === month && d.year === year);
  if (filtered.length <= 1) return filtered[0] || null;
  return filtered.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
}

export async function fetchLastAnalysis(userId: string) {
  const r = await fetch(`/api/users/${userId}/last-analysis`);
  if (!r.ok) throw new Error('Falha ao buscar última análise');
  const j = await r.json();
  return j?.data ?? null;
}
