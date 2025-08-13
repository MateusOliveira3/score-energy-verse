// server/lib/num.ts
// Conversões robustas BR/US para kWh/R$ + helpers

export function isFiniteNumber(n: any): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

// Tenta interpretar strings como número considerando padrões brasileiros
export function fromBRStringSmart(x: any): number {
  if (x === null || x === undefined) return 0;
  if (isFiniteNumber(x)) return x;

  const s = String(x).trim();
  if (!s) return 0;

  // limpeza leve
  const onlyDigits = s.replace(/[^\d.,-]/g, '');

  // caso "285,20" (clássico BR)
  if (onlyDigits.includes(',') && !onlyDigits.includes('.')) {
    const n = parseFloat(onlyDigits.replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }

  // caso só ponto: decidir se é decimal ou milhar
  if (onlyDigits.includes('.') && !onlyDigits.includes(',')) {
    const parts = onlyDigits.split('.');
    const last = parts[parts.length - 1];
    // heurística: se a parte final tem 1-3 dígitos, tratamos PONTO como DECIMAL
    if (/^\d{1,3}$/.test(last)) {
      const n = parseFloat(onlyDigits);
      return Number.isFinite(n) ? n : 0;
    }
    // senão, tratamos como milhar e removemos pontos
    const n = parseFloat(onlyDigits.replace(/\./g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  // misto ou sem separadores
  const n = parseFloat(onlyDigits.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

// Dinheiro sempre em BRL, aceita "285,20"/"285.20"
export function fromMoney(x: any): number {
  if (x === null || x === undefined) return 0;
  if (isFiniteNumber(x)) return x;

  const s = String(x).trim();
  if (!s) return 0;

  // CORRIGIDO: Para dinheiro, tratar ponto como decimal (formato americano)
  // "285.20" -> 285.20, "285,20" -> 285.20
  if (s.includes('.') && !s.includes(',')) {
    // Se tem ponto mas não vírgula, é formato americano (decimal)
    const n = parseFloat(s);
    if (Number.isFinite(n)) return n;
  }

  // Caso contrário, usar a função genérica (formato brasileiro)
  return fromBRStringSmart(x);
}

// kWh vindo do parser/Sheets (345.000, 41.700, 345,000 etc.)
export function fromKwh(x: any): number {
  if (x === null || x === undefined) return 0;
  if (isFiniteNumber(x)) return x;

  const s = String(x).trim();
  if (!s) return 0;

  // CORRIGIDO: Para kWh, tratar ponto como separador de milhar (formato brasileiro)
  // "345.000" -> 345000, "41.700" -> 41700
  if (s.includes('.') && !s.includes(',')) {
    // Se tem ponto mas não vírgula, é formato brasileiro (milhar)
    const n = parseFloat(s.replace(/\./g, ''));
    if (Number.isFinite(n) && n > 0 && n <= 200000) return n;
  }

  // Caso contrário, usar a função genérica
  const n = fromBRStringSmart(x);
  if (!Number.isFinite(n)) return 0;
  if (n > 200000) return 0; // muito improvável para fatura mensal
  return n;
}

// Seleciona o primeiro número finito e > 0
export function preferNumber(...candidates: any[]): number {
  for (const c of candidates) {
    const n = isFiniteNumber(c) ? c : fromBRStringSmart(c);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}

// Divide com segurança
export function safeDiv(a: any, b: any): number {
  const A = fromBRStringSmart(a);
  const B = fromBRStringSmart(b);
  if (!Number.isFinite(A) || !Number.isFinite(B) || B === 0) return 0;
  return A / B;
}

// Normaliza tarifa: se vier em R$/MWh (>=5), converte para R$/kWh
export function normalizeTariffUnit(t: any): number {
  const n = fromBRStringSmart(t);
  if (!Number.isFinite(n)) return 0;
  return n >= 5 ? n / 1000 : n;
}

// Funções de compatibilidade (mantidas para não quebrar código existente)
export function toNumberBR(x: any): number {
  return fromBRStringSmart(x);
}

export function toUSString(n: any): string {
  const v = isFiniteNumber(n) ? n : fromBRStringSmart(n);
  return Number.isFinite(v) ? String(v) : '0';
}

export function asSheetNumber(x: any, decimals?: number): number {
  const n = fromBRStringSmart(x);
  if (!Number.isFinite(n)) return 0;
  return typeof decimals === 'number' ? Number(n.toFixed(decimals)) : n;
}
