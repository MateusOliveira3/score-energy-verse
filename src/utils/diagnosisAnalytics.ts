import type { DiagnosisItem } from '@/services/diagnosis';
import { getSeasonalInsight } from '@/utils/seasonal';

export type MonthPoint = {
  month: string; // "5"
  year: string; // "2025"
  kwh: number;
  total: number;
  rpk: number; // R$/kWh
  score: number | null;
  tipsCount: number;
  created_at: string;
  // comparativos vs mês anterior
  deltaKwh: number | null;
  deltaTotal: number | null;
  deltaRpk: number | null;
  deltaScore: number | null;
};

export type DiagnosisAnalytics = {
  series: MonthPoint[]; // timeline ordenada (antigo → recente)
  avgKwhLast3: number; // média kWh últimos 3
  avgRpkLast3: number; // média R$/kWh últimos 3
  totalChangeKwh: number; // variação total de kWh (recente - primeiro)
  totalChangeRpk: number; // variação total R$/kWh
  bestImprovementMonth?: { month: string; year: string; kwhDrop: number } | null;
  currentDownStreak: number; // meses seguidos reduzindo kWh
  trend3vs3: { // média dos últimos 3 vs 3 anteriores
    kwh: number; // diff (últimos3 - anteriores3)
    rpk: number;
    score: number;
  };
  flags: {
    monthsWithZeroKwh: number;
    monthsWithHighRpk: number; // R$/kWh > 1,00 (ajustável)
  };
  seasonal?: {
    region: string;
    season: string;
    insight: string;
  } | null;
};

const r2 = (n: number) => Math.round(n * 100) / 100;
const r3 = (n: number) => Math.round(n * 1000) / 1000;

export function computeDiagnosisAnalytics(diag: DiagnosisItem[], userState?: string): DiagnosisAnalytics {
  // ordenar por data ASC para série temporal
  const items = [...diag].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  
  const series: MonthPoint[] = items.map((d, idx) => {
    const kwh = Number(d.consumption_kwh || 0);
    const total = Number(d.total_value_brl || 0);
    const rpk = kwh > 0 ? total / kwh : 0;
    
    const prev = idx > 0 ? items[idx - 1] : null;
    const prevK = prev ? Number(prev.consumption_kwh || 0) : null;
    const prevT = prev ? Number(prev.total_value_brl || 0) : null;
    const prevR = prev && prevK! > 0 ? (Number(prevT) / Number(prevK)) : null;
    
    return {
      month: String(d.month),
      year: String(d.year),
      kwh: r2(kwh),
      total: r2(total),
      rpk: r3(rpk),
      score: Number.isFinite(d.score_total) ? Number(d.score_total) : null,
      tipsCount: Array.isArray(d.tips) ? d.tips.length : 0,
      created_at: d.created_at,
      deltaKwh: prev ? r2(kwh - (prevK ?? 0)) : null,
      deltaTotal: prev ? r2(total - (prevT ?? 0)) : null,
      deltaRpk: prev ? r3(rpk - (prevR ?? 0)) : null,
      deltaScore: prev && Number.isFinite(d.score_total) && Number.isFinite(prev?.score_total as any) ? r2(Number(d.score_total) - Number(prev?.score_total)) : null,
    };
  });

  const last3 = series.slice(-3);
  const prev3 = series.slice(-6, -3);
  
  const avgKwhLast3 = r2(last3.reduce((s,x)=>s+x.kwh,0) / (last3.length || 1));
  const avgRpkLast3 = r3(last3.reduce((s,x)=>s+x.rpk,0) / (last3.length || 1));
  
  const first = series[0];
  const last = series[series.length - 1];
  const totalChangeKwh = first && last ? r2(last.kwh - first.kwh) : 0;
  const totalChangeRpk = first && last ? r3(last.rpk - first.rpk) : 0;

  // melhor melhoria: maior queda de kWh entre meses consecutivos (valor negativo mais intenso)
  let bestImprovementMonth: { month: string; year: string; kwhDrop: number } | null = null;
  for (const p of series) {
    if (p.deltaKwh != null && p.deltaKwh < 0) {
      if (!bestImprovementMonth || p.deltaKwh < bestImprovementMonth.kwhDrop) {
        bestImprovementMonth = {
          month: p.month,
          year: p.year,
          kwhDrop: p.deltaKwh
        };
      }
    }
  }

  // streak de queda
  let currentDownStreak = 0;
  for (let i = series.length - 1; i > 0; i--) {
    const d = series[i];
    if (d.deltaKwh != null && d.deltaKwh < 0) currentDownStreak++;
    else break;
  }

  const mean = (arr: number[]) => (arr.length ? arr.reduce((s,x)=>s+x,0)/arr.length : 0);
  const trend3vs3 = {
    kwh: r2(mean(last3.map(x=>x.kwh)) - mean(prev3.map(x=>x.kwh))),
    rpk: r3(mean(last3.map(x=>x.rpk)) - mean(prev3.map(x=>x.rpk))),
    score: r2(mean(last3.map(x=>x.score ?? 0)) - mean(prev3.map(x=>x.score ?? 0))),
  };

  const flags = {
    monthsWithZeroKwh: series.filter(x => x.kwh === 0).length,
    monthsWithHighRpk: series.filter(x => x.rpk > 1.0).length, // limiar ajustável
  };

  // Insights sazonais baseados no mês mais recente
  const lastMonthPoint = series[series.length - 1];
  const seasonal = lastMonthPoint ? getSeasonalInsight(userState || 'SP', Number(lastMonthPoint.month)) : null;

  return {
    series,
    avgKwhLast3,
    avgRpkLast3,
    totalChangeKwh,
    totalChangeRpk,
    bestImprovementMonth,
    currentDownStreak,
    trend3vs3,
    flags,
    seasonal
  };
}
