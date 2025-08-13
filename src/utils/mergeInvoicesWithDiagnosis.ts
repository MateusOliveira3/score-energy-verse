export type InvoiceLike = {
  id?: string;
  user_id?: string;
  // pt/en variantes aceitas:
  month?: string|number;  mes?: string|number;  mês?: string|number;
  year?: string|number;   ano?: string|number;
  consumption?: number;   consumo_kwh?: number; consumo_total_kwh?: number; consumo_te_kwh?: number;
  total_value?: number;   total_value_brl?: number; valor_total_brl?: number; valor_total?: number;
  created_at?: string;
  file_name?: string; fileUrl?: string; // se existir
  [k: string]: any;
};

export type DiagnosisLike = {
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

function normMonth(m: any): string {
  if (m == null) return '';
  const s = String(m).trim();
  // Aceita "05", "5", "MAI/2025" etc -> extrai número
  const onlyNum = s.match(/\d+/)?.[0];
  if (!onlyNum) return s.toUpperCase();
  return String(Number(onlyNum)); // remove zeros à esquerda
}

function normYear(y: any): string {
  if (y == null) return '';
  const n = Number(String(y).slice(-4));
  return Number.isFinite(n) ? String(n) : String(y);
}

function n(v: any): number {
  if (typeof v === 'number') return v;
  if (typeof v !== 'string') return 0;
  const s = v.replace(/\./g, '').replace(',', '.');
  const f = Number(s);
  return Number.isFinite(f) ? f : 0;
}

export function mergeInvoicesWithDiagnosis(
  invoices: InvoiceLike[] = [],
  diagnosis: DiagnosisLike[] = []
) {
  // índice diagnosis por (year-month) -> mais recente primeiro
  const byYM = new Map<string, DiagnosisLike[]>();
  for (const d of diagnosis) {
    const key = `${normYear(d.year)}-${normMonth(d.month)}`;
    if (!byYM.has(key)) byYM.set(key, []);
    byYM.get(key)!.push(d);
  }
  for (const [k, arr] of byYM) {
    arr.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    byYM.set(k, arr);
  }

  return invoices.map((inv, i) => {
    const m = normMonth((inv as any).month ?? (inv as any).mes ?? (inv as any).mês);
    const y = normYear((inv as any).year ?? (inv as any).ano);
    const key = `${y}-${m}`;
    const diag = byYM.get(key)?.[0] || null;

    const invKwh = (inv as any).consumption ?? inv.consumo_kwh ?? inv.consumo_total_kwh ?? inv.consumo_te_kwh ?? 0;
    const invTotal = inv.total_value ?? inv.total_value_brl ?? inv.valor_total_brl ?? inv.valor_total ?? 0;

    const kwh = diag ? diag.consumption_kwh : n(invKwh);
    const total = diag ? diag.total_value_brl : n(invTotal);

    const valuePerKwh = kwh > 0 ? total / kwh : 0;

    return {
      // campos originais do invoice (mantidos)
      ...inv,
      // chaves normalizadas que o histórico vai usar
      _month: m,                 // string "5"
      _year: y,                  // string "2025"
      _consumption_kwh: kwh,     // número
      _total_value_brl: total,   // número
      _value_per_kwh: valuePerKwh,
      _added_at: diag?.created_at ?? inv.created_at ?? null,
      _score_total: diag?.score_total ?? null,
      _tips: diag?.tips ?? [],
      _diag_breakdown: diag?.breakdown ?? {},
      _hasDiagnosis: Boolean(diag),
      _idx: i
    };
  });
}
