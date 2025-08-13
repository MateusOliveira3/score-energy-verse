export function toNumberBR(x: any): number {
  if (x === null || x === undefined) return 0;
  if (typeof x === 'number' && Number.isFinite(x)) return x;
  const s = String(x).trim();
  if (!s) return 0;
  // remove separador de milhar "." e troca decimal "," por "."
  const n = parseFloat(s.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/** usado quando precisar string US, mas prefira sempre enviar Number ao Sheets */
export function toUSString(n: any): string {
  const v = typeof n === 'number' ? n : toNumberBR(n);
  return Number.isFinite(v) ? String(v) : '0';
}

/** tarifa pode vir em R$/MWh; se >= 5 assume MWh e divide por 1000 para virar R$/kWh */
export function normalizeTariffUnit(t: any): number {
  const v = toNumberBR(t);
  if (!Number.isFinite(v) || v <= 0) return 0;
  return v >= 5 ? v / 1000 : v;
}

/** divisão segura evitando NaN/Infinity */
export function safeDiv(a: any, b: any): number {
  const A = toNumberBR(a), B = toNumberBR(b);
  if (B <= 0) return 0;
  const r = A / B;
  return Number.isFinite(r) ? r : 0;
}

/** converter para Number e opcionalmente fixar casas; ideal antes de gravar no Sheets */
export function asSheetNumber(x: any, decimals?: number): number {
  const n = toNumberBR(x);
  if (!Number.isFinite(n)) return 0;
  return typeof decimals === 'number' ? Number(n.toFixed(decimals)) : n;
}
