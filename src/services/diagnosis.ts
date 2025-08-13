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

export type InvoiceLite = {
  id: string;
  user_id: string;
  file_name: string;
  unidade_consumidora: string;
  month: number;
  year: number;
  consumption_kwh: number;
  total_value_brl: number;
  value_per_kwh: number;
  status: string;
  created_at: string | null;
};

export type DiagnosisLite = {
  id: string;
  user_id: string;
  month: number;
  year: number;
  score_total: number;
  score_breakdown: Record<string, number>;
  recommendations: string[];
  value_per_kwh: number;
  created_at: string | null;
};

export type LastInvoiceDTO = {
  id: string;
  user_id: string;
  month: number;
  year: number;
  consumption_kwh: number;
  total_value_brl: number;
  value_per_kwh: number;
  status?: string;
  created_at?: string | null;
  tips?: string[];
  score_total?: number;
  score_breakdown?: Record<string, number>;
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

export async function fetchLastInvoice(userId: string): Promise<LastInvoiceDTO | null> {
  const r = await fetch(`/api/users/${userId}/last-invoice`);
  if (!r.ok) {
    console.warn('[fetchLastInvoice] status', r.status);
    return null;
  }
  const data = await r.json();
  console.log('[fetchLastInvoice] payload', data);
  return data;
}

export async function fetchHistory(userId: string) {
  const r = await fetch(`/api/users/${userId}/history`);
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'Erro ao carregar histórico');
  return j.data as { invoices: InvoiceLite[]; diagnosis: DiagnosisLite[] };
}
