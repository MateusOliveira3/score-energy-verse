// server/lib/invoice-parser.ts
import { InvoiceParsed, asNumberOrZero } from './types.js';

/**
 * Parser desacoplado para transformar texto "flat" da fatura
 * em um objeto InvoiceParsed. Não lança exceções: sempre retorna valores default
 * quando não encontrar padrões.
 *
 * Use logs leves com prefixo [PARSER] para facilitar diagnóstico.
 */

const MONTH_MAP: Record<string, string> = {
  JAN: '01', FEV: '02', FEB: '02', MAR: '03', ABR: '04', APR: '04',
  MAI: '05', MAY: '05', JUN: '06', JUL: '07', AGO: '08', AUG: '08',
  SET: '09', SEP: '09', OUT: '10', OCT: '10', NOV: '11', DEZ: '12', DEC: '12'
};

// Helpers robustos para números no padrão BR: "1.234,56"
function parseBRNumber(input: string | null | undefined): number {
  if (!input) return 0;
  const cleaned = input.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

// Captura o primeiro número que siga imediatamente a uma label/palavra-chave
function extractNumberAfterKeyword(text: string, keyword: RegExp, numberPattern = /[\d.,]+/): number {
  try {
    const idx = text.search(keyword);
    if (idx === -1) return 0;
    const slice = text.slice(idx);
    const m = slice.match(numberPattern);
    return m ? parseBRNumber(m[0]) : 0;
  } catch (_) {
    return 0;
  }
}

// Captura "kWh" ao lado direito de uma label
function extractKwhAfterLabel(text: string, label: RegExp): number {
  try {
    const idx = text.search(label);
    if (idx === -1) return 0;
    const slice = text.slice(idx, idx + 220); // janela curta pra reduzir falso-positivo
    const m = slice.match(/([\d.,]+)\s*kWh/i);
    return m ? parseBRNumber(m[1]) : 0;
  } catch (_) {
    return 0;
  }
}

// Detecta presença de palavras-chave (tolerante a variações)
function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((rx) => rx.test(text));
}

// Extrai mês/ano a partir de "AGO/2025", "SET/24", etc.
function extractMonthYear(text: string): { month: string; year: string } {
  // Busca algo tipo "ABC/2025" ou "ABC/25"
  const m = text.match(/\b([A-Z]{3})\s*\/\s*(\d{2,4})\b/i);
  if (!m) return { month: '', year: '' };
  const rawMon = m[1].toUpperCase();
  const rawYear = m[2];
  const month = MONTH_MAP[rawMon] ?? '';
  let year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
  if (!/^\d{4}$/.test(year)) year = '';
  return { month, year };
}

export function parseInvoiceText(rawText: string): InvoiceParsed {
  try {
    const cleaned = (rawText || '')
      .replace(/\s+/g, ' ')
      .replace(/:+/g, ':')
      .trim();

    if (!cleaned) {
      console.log('[PARSER] Texto vazio recebido.');
    }

    // 1) Mês/Ano
    const { month, year } = extractMonthYear(cleaned);

    // 2) Consumo total (kWh)
    // Estratégia: somar itens que você já usa no backend:
    // "Energia Elétrica kWh" + "Energia SCEE s/ ICMS kWh"
    // + opcionalmente "Demais itens" que tragam kWh (se houver).
    const eletricityKWh = extractKwhAfterLabel(cleaned, /Energia El[eé]trica\s*kWh?/i);
    const sceeeKWh      = extractKwhAfterLabel(cleaned, /Energia\s*SCEE\s*s?\/\s*ICMS\s*kWh?/i);
    // GD I (geração distribuída) em kWh
    const gdiKWh        = extractKwhAfterLabel(cleaned, /Energia\s*compensada\s*GD\s*I\s*kWh?/i);

    const consumption_kwh = Number((eletricityKWh + sceeeKWh).toFixed(2));

    // 3) Valor total (R$)
    // Buscar após labels comuns: "Total a pagar", "Total da fatura", "Valor total"
    let total_value_brl = extractNumberAfterKeyword(cleaned, /(Total\s*a\s*pagar|Total\s*da\s*fatura|Valor\s*total)/i);
    if (total_value_brl === 0) {
      // fallback adicional: procurar "R$ xxx,xx" próximo a "Total"
      const m = cleaned.match(/Total[^\d]*(R\$\s*[\d.,]+)/i);
      total_value_brl = m ? parseBRNumber(m[1]) : 0;
    }

    // 4) Reativo excedente (has_reactive)
    const has_reactive = hasAny(cleaned, [
      /reativa\s*excedente/i,
      /energia\s*reativa/i,
      /fator\s*de\s*pot[êe]ncia\s*baixo/i
    ]);

    // 5) GD presente (has_gd)
    const has_gd = gdiKWh > 0 || hasAny(cleaned, [
      /compensad[ao]?\s*GD/i,
      /microger[aá]?[cç][aã]o/i,
      /ger[aá]?[cç][aã]o\s*distribu[ií]da/i
    ]);

    // 6) Tarifa (string livre – melhor esforço)
    const tariffMatch = cleaned.match(/\b(B1\s*(Convencional|Branca)|Grupo\s*A|B3|B2|B[\d])\b/i);
    const tariff = tariffMatch ? tariffMatch[0].trim() : '';

    // 7) Valor por kWh (R$/kWh)
    const value_per_kwh = consumption_kwh > 0
      ? Number((total_value_brl / consumption_kwh).toFixed(4))
      : 0;

    // 8) Contribuição de iluminação pública (opcional)
    // "Contrib Ilum Publica Municipal", "CIP", etc.
    let publicLightingContribution = extractNumberAfterKeyword(cleaned, /(Contrib(\.|ui[cç][aã]o)?\s*Ilum(\.|ina[cç][aã]o)?\s*P(ú|u)blica(\s*Municipal)?|CIP)/i);
    if (publicLightingContribution === 0) {
      const cip = cleaned.match(/\bCIP\b[^\d]*([\d.,]+)/i);
      publicLightingContribution = cip ? parseBRNumber(cip[1]) : 0;
    }

    const invoice: InvoiceParsed = {
      month,
      year,
      consumption_kwh,
      total_value_brl: Number(total_value_brl.toFixed(2)),
      has_reactive,
      has_gd,
      tariff,
      value_per_kwh,
      publicLightingContribution
    };

    console.log('[PARSER] OK:', {
      month: invoice.month,
      year: invoice.year,
      kWh: invoice.consumption_kwh,
      total: invoice.total_value_brl,
      vpk: invoice.value_per_kwh,
      reactive: invoice.has_reactive,
      gd: invoice.has_gd,
      tariff: invoice.tariff
    });

    return invoice;
  } catch (err: any) {
    console.error('[PARSER] Falha no parse:', err?.message || err);
    // Nunca lançar – retornar defaults seguros
    return {
      month: '',
      year: '',
      consumption_kwh: 0,
      total_value_brl: 0,
      has_reactive: false,
      has_gd: false,
      tariff: '',
      value_per_kwh: 0,
      publicLightingContribution: 0
    };
  }
}
