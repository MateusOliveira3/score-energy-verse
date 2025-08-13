// server/lib/num.ts
/**
 * Converte strings BR/Sheets/US para número de forma robusta.
 * Casos tratados:
 * - "285,20" -> 285.20
 * - "285.20" -> 285.20
 * - "345.000" / "41.700" (3 casas técnicas) -> 345 / 41.7
 * - "34.500" (milhar) -> 34500
 */
export function toNumberBR(x: any): number {
  if (x === null || x === undefined) return 0;
  if (typeof x === 'number' && Number.isFinite(x)) return x;
  const raw = String(x).trim();
  if (!raw) return 0;

  // Decimal BR (tem vírgula)
  if (raw.includes(',')) {
    const s = raw.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  }

  // 3 casas "técnicas" (ex.: "41.700" => 41.7 | "345.000" => 345)
  if (/^\d+\.\d{3}$/.test(raw)) {
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : 0;
  }

  // Milhar "clássico" (ex.: "34.500", "1.234.567")
  if (/^\d{1,3}(\.\d{3})+$/.test(raw)) {
    const n = parseFloat(raw.replace(/\./g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

export function coerceKwhIfSuspicious(n: number, raw?: any): number {
  if (!Number.isFinite(n)) return 0;
  const s = String(raw ?? '');
  // se veio no formato 3 casas técnicas e o número ficou "inflado" (múltiplo de 1000), divida
  if (/^\d+\.\d{3}$/.test(s) && n >= 10000 && n % 1000 === 0) {
    return n / 1000;
  }
  return n;
}

function isoDate(x: any): number {
  try { return new Date(String(x)).getTime(); } catch { return 0; }
}

export function toUSString(n: number, decimals = 3): string {
  if (!Number.isFinite(n)) return '0';
  return n.toFixed(decimals).replace(',', '.');
}

export function safeDiv(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return 0;
  return a / b;
}

/**
 * Normaliza unidade de tarifa: se vier suspeita em MWh (>= 5 R$/kWh normalmente é alto),
 * trate conforme sua regra de negócio; mantemos como está se vier em kWh.
 */
export function normalizeTariffUnit(t: number): number {
  if (!Number.isFinite(t)) return 0;
  // aqui não mexemos, pois o problema estava no parse, não na unidade
  return t;
}

import { monthToSeason, seasonPt, regionFromUF } from './season.js';

// NOVA – recebe a última linha e devolve payload para o frontend
export function buildLastAnalysisPayload(last: { type: 'diagnosis'|'invoice', data: any }, userProfile?: any) {
  const d = last.data || {};

  // tenta derivar mês/ano
  const month = toNumberBR(d.month || d.mes);
  const year  = toNumberBR(d.year  || d.ano);

  // consumo/valor
  const consumption = toNumberBR(d.consumption_kwh || d.consumo_kwh || d.consumo_total_kwh || d.consumo_total_kwh_calculado);
  const totalValue  = toNumberBR(d.total_value_brl || d.valor_total_brl);

  // valor por kWh robusto
  const valuePerKwh = safeDiv(totalValue, consumption);

  // impostos / pico se existirem
  const impostosPerc = toNumberBR(d.impostos_perc || d.impostos || 0);
  const picoSharePerc = toNumberBR(d.pico_perc || 0);

  // UF do usuário (se tiver) -> região/estação
  const uf = (userProfile?.uf || userProfile?.state || userProfile?.estado || '').toString().toUpperCase() || (d.uf || d.estado || '').toString().toUpperCase();
  const region = regionFromUF(uf);
  const season = seasonPt(monthToSeason(month || (new Date().getMonth()+1)));

  // bandeira/tarifas
  const bandeira = (d.bandeira_tarifaria || d.tarifa_bandeira_ || d.tarifa_bandeira_com_impostos || '').toString() || '—';
  const te = normalizeTariffUnit(d.tarifa_te_com_impostos || d.tarifa_te_sem_impostos || 0);
  const tusd = normalizeTariffUnit(d.tarifa_tusd_com_impostos || d.tarifa_tusd_sem_impostos || 0);

  return {
    month, year,
    uf, region, season,
    consumption_kwh: consumption,
    total_value_brl: totalValue,
    value_per_kwh: valuePerKwh,
    impostos_perc: impostosPerc,
    pico_perc: picoSharePerc,
    bandeira,
    te, tusd,
    score_total: toNumberBR(d.score_total || 0),
    tips_raw: d.recommendations_json || d.recomendacoes_json || '[]'
  };
}

export function buildSmartTips(input: {
  consumption_kwh: number;
  value_per_kwh: number;
  impostos_perc: number;
  pico_perc: number;
  bandeira: string;
  region: string;
  seasonPt: string;
  hasReactive?: boolean;
  tariff?: string;
}) {
  const tips: string[] = [];

  // consumo x valor unitário
  if (input.value_per_kwh > 1.0) {
    tips.push('⚠️ Seu custo por kWh está alto. Avalie plano tarifário e combate a desperdícios.');
  } else {
    tips.push('🟢 Seu custo por kWh está dentro do esperado.');
  }

  // impostos
  if (input.impostos_perc > 20) {
    tips.push('⚠️ Impostos representam parcela relevante. Reveja enquadramento tributário/ICMS e possíveis isenções.');
  }

  // pico
  if (input.pico_perc > 40) {
    tips.push('⚠️ Alta participação do horário de pico. Realoque cargas e avalie tarifa com ponta diferenciada.');
  }

  // bandeira
  if ((input.bandeira || '').toLowerCase().includes('amarela')) {
    tips.push('🟡 Bandeira Amarela vigente: custo extra temporário. Reforce ações de eficiência.');
  }

  // reativo
  if (input.hasReactive) {
    tips.push('🔴 Multa por reativo identificada. Considere banco de capacitores / correção de FP.');
  }

  // sazonalidade simples
  if (input.seasonPt === 'Inverno' && input.region === 'Sul') {
    tips.push('❄️ Inverno no Sul pode elevar uso de aquecimento. Programe horários e isole ambientes.');
  }
  if (input.seasonPt === 'Season' && ['Norte','Nordeste','Sudeste','Centro-Oeste'].includes(input.region)) {
    tips.push('☀️ Verão: atenção ao ar-condicionado. Verifique selos de eficiência e manutenção de filtros.');
  }

  return tips;
}

export async function fetchLastAnalysis(userId: string) {
  const r = await fetch(`/api/users/${userId}/last-analysis`);
  if (!r.ok) throw new Error('Falha ao buscar última análise');
  const j = await r.json();
  return j?.data ?? null;
}
