import {
  InvoiceFieldConfidence,
  InvoiceParsedField,
  InvoiceParsedFields,
  InvoiceParserResult,
} from '@/types/mvp';
import { inflateSync, unzlibSync } from 'fflate';

type InvoiceFileLike = {
  name?: string;
  type?: string;
  size?: number;
  arrayBuffer?: () => Promise<ArrayBuffer>;
  text?: () => Promise<string>;
};

type Candidate<T> = {
  value: T;
  confidence: Exclude<InvoiceFieldConfidence, 'missing'>;
  index: number;
};

type Rule<T> = {
  pattern: RegExp;
  confidence: Exclude<InvoiceFieldConfidence, 'missing'>;
  parse: (match: RegExpMatchArray) => T | undefined;
  validate?: (value: T) => boolean;
};

type PdfExtractionDiagnostics = {
  streamCount: number;
  flateStreamCount: number;
  multiFilterStreamCount: number;
  decodedStreamCount: number;
  failedStreamCount: number;
  compressedByteLength: number;
  decompressedByteLength: number;
  toUnicodeCMapCount: number;
  encodedFontObjectCount: number;
  tjOperatorCount: number;
  tjArrayOperatorCount: number;
  hexTextTokenCount: number;
  usedPdfJsFallback: boolean;
  pdfJsPageCount?: number;
  pdfJsTextLength?: number;
};

const PT_BR_MONTHS: Record<string, string> = {
  JAN: '01',
  JANEIRO: '01',
  FEV: '02',
  FEVEREIRO: '02',
  MAR: '03',
  MARCO: '03',
  ABR: '04',
  ABRIL: '04',
  MAI: '05',
  MAIO: '05',
  JUN: '06',
  JUNHO: '06',
  JUL: '07',
  JULHO: '07',
  AGO: '08',
  AGOSTO: '08',
  SET: '09',
  SETEMBRO: '09',
  OUT: '10',
  OUTUBRO: '10',
  NOV: '11',
  NOVEMBRO: '11',
  DEZ: '12',
  DEZEMBRO: '12',
};

const EMPTY_FIELD = <T>(): InvoiceParsedField<T> => ({
  confidence: 'missing',
});

const buildEmptyFields = (): InvoiceParsedFields => ({
  providerName: EMPTY_FIELD<string>(),
  consumerUnit: EMPTY_FIELD<string>(),
  referenceMonth: EMPTY_FIELD<string>(),
  issueDate: EMPTY_FIELD<string>(),
  dueDate: EMPTY_FIELD<string>(),
  totalValue: EMPTY_FIELD<number>(),
  consumptionKwh: EMPTY_FIELD<number>(),
  daysBilled: EMPTY_FIELD<number>(),
  previousReading: EMPTY_FIELD<number>(),
  currentReading: EMPTY_FIELD<number>(),
  meterConstant: EMPTY_FIELD<number>(),
  tariffFlag: EMPTY_FIELD<string>(),
  teValue: EMPTY_FIELD<number>(),
  tusdValue: EMPTY_FIELD<number>(),
  publicLightingFee: EMPTY_FIELD<number>(),
  taxesTotal: EMPTY_FIELD<number>(),
});

const confidenceRank: Record<InvoiceFieldConfidence, number> = {
  missing: 0,
  low: 1,
  medium: 2,
  high: 3,
};

const downgradeConfidence = (
  confidence: Exclude<InvoiceFieldConfidence, 'missing'>
): Exclude<InvoiceFieldConfidence, 'missing'> => {
  if (confidence === 'high') {
    return 'medium';
  }

  return 'low';
};

const upgradeConfidence = (
  confidence: Exclude<InvoiceFieldConfidence, 'missing'>
): Exclude<InvoiceFieldConfidence, 'missing'> => {
  if (confidence === 'low') {
    return 'medium';
  }

  return 'high';
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const normalizeAscii = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/\r/g, '\n');

export const normalizeInvoiceText = (value: string) =>
  normalizeAscii(value)
    .replace(/\0/g, ' ')
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .toUpperCase()
    .trim();

const normalizeInlineWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

const buildSearchText = (normalizedText: string) => {
  const lines = normalizedText
    .split('\n')
    .map((line) => normalizeInlineWhitespace(line))
    .filter(Boolean);

  if (lines.length === 0) {
    return normalizedText;
  }

  const windows = new Set<string>();
  const windowSize = 6;

  for (let start = 0; start < lines.length; start += 1) {
    let combined = '';

    for (let offset = 0; offset < windowSize && start + offset < lines.length; offset += 1) {
      combined = combined ? `${combined} ${lines[start + offset]}` : lines[start + offset];
      windows.add(combined);
    }
  }

  return [normalizedText, lines.join(' '), ...windows].join('\n');
};

export interface InvoiceDerivedEvidence {
  averageCostPerKwh?: number;
  daysBilled?: number;
  offPeakConsumptionKwh?: number;
  peakConsumptionKwh?: number;
  peakWindowLabel?: string;
  tariffFlag?: string;
}

const parseBrazilianNumber = (value: string): number | undefined => {
  const compact = value.replace(/[^\d,.-]/g, '');

  if (!compact) {
    return undefined;
  }

  const lastComma = compact.lastIndexOf(',');
  const lastDot = compact.lastIndexOf('.');

  let normalized = compact;

  if (lastComma > -1 && lastDot > -1) {
    normalized =
      lastComma > lastDot
        ? compact.replace(/\./g, '').replace(',', '.')
        : compact.replace(/,/g, '');
  } else if (lastComma > -1) {
    normalized = compact.replace(/\./g, '').replace(',', '.');
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const extractKwhValueFromLine = (line: string) => {
  const beforeKwhMatch = line.match(/([\d.,]+)\s*KWH\b/);

  if (beforeKwhMatch) {
    return parseBrazilianNumber(beforeKwhMatch[1]);
  }

  const afterKwhMatch = line.match(/\bKWH\b[^0-9]{0,8}([\d.,]+)/);
  return afterKwhMatch ? parseBrazilianNumber(afterKwhMatch[1]) : undefined;
};

const extractPeakWindowLabel = (searchText: string) => {
  const normalizedWindowMatch = searchText.match(
    /\b(?:HORARIO|HORA|PONTA)\b[^0-9]{0,24}(\d{1,2})[:H](\d{2})\s*(?:A|AS|ATE|-)\s*(\d{1,2})[:H](\d{2})/
  );

  if (!normalizedWindowMatch) {
    return undefined;
  }

  const [, startHour, startMinute, endHour, endMinute] = normalizedWindowMatch;
  return `${startHour.padStart(2, '0')}:${startMinute}-${endHour.padStart(2, '0')}:${endMinute}`;
};

const extractPeakAndOffPeakConsumption = (normalizedText: string) => {
  const lines = buildSearchText(normalizedText)
    .split('\n')
    .map((line) => normalizeInlineWhitespace(line))
    .filter(Boolean);
  const peakCandidates: number[] = [];
  const offPeakCandidates: number[] = [];

  lines.forEach((line) => {
    if (!/\bKWH\b/.test(line)) {
      return;
    }

    const kwhValue = extractKwhValueFromLine(line);

    if (!isFiniteNumber(kwhValue)) {
      return;
    }

    if (/\b(FORA PONTA|FORA-DE-PONTA|FP)\b/.test(line)) {
      offPeakCandidates.push(kwhValue);
      return;
    }

    if (/\bPONTA\b/.test(line)) {
      peakCandidates.push(kwhValue);
    }
  });

  return {
    offPeakConsumptionKwh:
      offPeakCandidates.length > 0 ? offPeakCandidates[0] : undefined,
    peakConsumptionKwh: peakCandidates.length > 0 ? peakCandidates[0] : undefined,
  };
};

export const extractInvoiceDerivedEvidence = (
  source: Pick<InvoiceParserResult, 'fields' | 'normalizedText'> & {
    consumption?: number;
    totalValue?: number;
  }
): InvoiceDerivedEvidence => {
  const totalValue = source.totalValue ?? source.fields.totalValue.value;
  const consumption = source.consumption ?? source.fields.consumptionKwh.value;
  const { peakConsumptionKwh, offPeakConsumptionKwh } = extractPeakAndOffPeakConsumption(
    source.normalizedText
  );
  const averageCostPerKwh =
    isFiniteNumber(totalValue) && isFiniteNumber(consumption) && consumption > 0
      ? totalValue / consumption
      : undefined;

  return {
    averageCostPerKwh,
    daysBilled: source.fields.daysBilled.value,
    offPeakConsumptionKwh,
    peakConsumptionKwh,
    peakWindowLabel:
      extractPeakWindowLabel(source.normalizedText) ||
      (isFiniteNumber(peakConsumptionKwh) ? 'o horario de ponta indicado na fatura' : undefined),
    tariffFlag: source.fields.tariffFlag.value,
  };
};

const parseIntegerValue = (value: string): number | undefined => {
  const parsed = parseBrazilianNumber(value);

  if (!isFiniteNumber(parsed)) {
    return undefined;
  }

  return Math.round(parsed);
};

const parseReadingNumber = (value: string): number | undefined => {
  const compact = value.replace(/[^\d,.-]/g, '');

  if (!compact) {
    return undefined;
  }

  if (!compact.includes(',') && compact.includes('.')) {
    const normalized = compact.replace(/\./g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return parseBrazilianNumber(compact);
};

const normalizeDateValue = (value: string): string | undefined => {
  const match = value.match(/\b(\d{2})\/(\d{2})\/(\d{2,4})\b/);

  if (!match) {
    return undefined;
  }

  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText.length === 2 ? `20${yearText}` : yearText);

  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    return undefined;
  }

  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2000 || year > 2100) {
    return undefined;
  }

  return `${dayText}/${monthText}/${year.toString().padStart(4, '0')}`;
};

const normalizeReferenceMonth = (value: string): string | undefined => {
  const compactMatch = value.match(/\b(0[1-9]|1[0-2])\/(\d{4})\b/);

  if (compactMatch) {
    return `${compactMatch[1]}/${compactMatch[2]}`;
  }

  const monthNameMatch = value.match(
    /\b(JAN(?:EIRO)?|FEV(?:EREIRO)?|MAR(?:CO)?|ABR(?:IL)?|MAI(?:O)?|JUN(?:HO)?|JUL(?:HO)?|AGO(?:STO)?|SET(?:EMBRO)?|OUT(?:UBRO)?|NOV(?:EMBRO)?|DEZ(?:EMBRO)?)\b(?:\s+DE)?\s*[\/-]?\s*(\d{4})\b/
  );

  if (!monthNameMatch) {
    return undefined;
  }

  const month = PT_BR_MONTHS[monthNameMatch[1]];

  if (!month) {
    return undefined;
  }

  return `${month}/${monthNameMatch[2]}`;
};

const sanitizeProviderName = (value: string) => {
  const cleaned = value
    .replace(/\b(CNPJ|IE|CPF|ENDERECO|RUA|AVENIDA|CEP)\b[\s\S]*$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return cleaned.length >= 4 ? cleaned : undefined;
};

const sanitizeConsumerUnit = (value: string) => {
  const cleaned = value.replace(/[^\dA-Z./-]/g, '').trim();
  return cleaned.length >= 4 ? cleaned : undefined;
};

const sanitizeTariffFlag = (value: string) => {
  const cleaned = value
    .replace(/\s{2,}/g, ' ')
    .replace(/[.;]+$/g, '')
    .trim();

  if (!cleaned) {
    return undefined;
  }

  const knownFlag = cleaned.match(
    /\b(ESCASSEZ HIDRICA|SEM BANDEIRA|VERMELHA PATAMAR ?[12]|VERMELHA|AMARELA|VERDE)\b/
  );

  return knownFlag?.[0];
};

const pushCandidate = <T>(
  candidates: Candidate<T>[],
  value: T | undefined,
  confidence: Exclude<InvoiceFieldConfidence, 'missing'>,
  index: number,
  validate?: (value: T) => boolean
) => {
  if (value === undefined) {
    return;
  }

  if (validate && !validate(value)) {
    return;
  }

  candidates.push({ value, confidence, index });
};

const collectCandidates = <T>(normalizedText: string, rules: Rule<T>[]): Candidate<T>[] => {
  const candidates: Candidate<T>[] = [];

  rules.forEach((rule) => {
    for (const match of normalizedText.matchAll(rule.pattern)) {
      pushCandidate(
        candidates,
        rule.parse(match),
        rule.confidence,
        match.index ?? Number.MAX_SAFE_INTEGER,
        rule.validate
      );
    }
  });

  return candidates;
};

const resolveField = <T>(candidates: Candidate<T>[]): InvoiceParsedField<T> => {
  if (candidates.length === 0) {
    return EMPTY_FIELD<T>();
  }

  const sorted = [...candidates].sort((left, right) => {
    const confidenceDelta = confidenceRank[right.confidence] - confidenceRank[left.confidence];

    if (confidenceDelta !== 0) {
      return confidenceDelta;
    }

    return left.index - right.index;
  });

  const best = sorted[0];
  const bestValueKey = JSON.stringify(best.value);
  const conflictingBest = sorted.some(
    (candidate) =>
      candidate !== best &&
      confidenceRank[candidate.confidence] === confidenceRank[best.confidence] &&
      JSON.stringify(candidate.value) !== bestValueKey
  );

  return {
    value: best.value,
    confidence: conflictingBest ? downgradeConfidence(best.confidence) : best.confidence,
  };
};

const validateCurrency = (value: number) => value > 0 && value < 1_000_000;
const validateConsumption = (value: number) => value >= 0 && value < 10_000_000;
const validateDays = (value: number) => value >= 1 && value <= 90;
const validateReading = (value: number) => value >= 0 && value < 100_000_000;
const validateConstant = (value: number) => value > 0 && value <= 1000;

const createPdfExtractionDiagnostics = (binaryText: string): PdfExtractionDiagnostics => ({
  streamCount: 0,
  flateStreamCount: 0,
  multiFilterStreamCount: 0,
  decodedStreamCount: 0,
  failedStreamCount: 0,
  compressedByteLength: 0,
  decompressedByteLength: 0,
  toUnicodeCMapCount: binaryText.match(/\/TOUNICODE\b/gi)?.length ?? 0,
  encodedFontObjectCount:
    binaryText.match(/\/ENCODING\b(?!\s*\/(?:WINANSIENCODING|MACROMANENCODING|STANDARDENCODING))/gi)
      ?.length ?? 0,
  tjOperatorCount: binaryText.match(/\bTj\b/g)?.length ?? 0,
  tjArrayOperatorCount: binaryText.match(/\bTJ\b/g)?.length ?? 0,
  hexTextTokenCount: binaryText.match(/<[\dA-F\s]{2,}>\s*(?:Tj|TJ|["'])/gi)?.length ?? 0,
  usedPdfJsFallback: false,
});

const decodePdfLiteralString = (value: string) => {
  let result = '';

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if (char !== '\\') {
      result += char;
      continue;
    }

    const next = value[index + 1];

    if (!next) {
      break;
    }

    if (/[0-7]/.test(next)) {
      let octal = next;
      let cursor = index + 2;

      while (cursor < value.length && octal.length < 3 && /[0-7]/.test(value[cursor])) {
        octal += value[cursor];
        cursor += 1;
      }

      result += String.fromCharCode(parseInt(octal, 8));
      index += octal.length;
      continue;
    }

    const escaped: Record<string, string> = {
      n: '\n',
      r: '\r',
      t: '\t',
      b: '\b',
      f: '\f',
      '(': '(',
      ')': ')',
      '\\': '\\',
    };

    result += escaped[next] ?? next;
    index += 1;
  }

  return result;
};

const decodePdfHexString = (value: string) => {
  const compact = value.replace(/\s+/g, '');
  const evenHex = compact.length % 2 === 0 ? compact : `${compact}0`;
  const bytes = new Uint8Array(evenHex.length / 2);

  for (let index = 0; index < evenHex.length; index += 2) {
    bytes[index / 2] = Number.parseInt(evenHex.slice(index, index + 2), 16);
  }

  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(bytes.slice(2));
  }

  return new TextDecoder('latin1').decode(bytes);
};

const decodePdfStringToken = (value: string) => {
  const trimmed = value.trim();

  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    return decodePdfLiteralString(trimmed.slice(1, -1));
  }

  if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
    return decodePdfHexString(trimmed.slice(1, -1));
  }

  return '';
};

const extractPdfStringsFromTextBlock = (value: string) => {
  const parts: string[] = [];
  const literalMatches = value.matchAll(/\(((?:\\.|[^\\()])*)\)/g);

  for (const match of literalMatches) {
    parts.push(decodePdfLiteralString(match[1]));
  }

  const hexMatches = value.matchAll(/<([0-9A-F\s]+)>/g);

  for (const match of hexMatches) {
    parts.push(decodePdfHexString(match[1]));
  }

  return parts;
};

const extractPdfTextFromArrayOperator = (value: string) => {
  const body = value.replace(/^\[/, '').replace(/\]\s*TJ$/i, '');
  const tokens = body.match(/(\((?:\\.|[^\\()])*\)|<[\dA-F\s]+>|-?\d+(?:\.\d+)?)/g) ?? [];
  let result = '';
  let pendingSpace = false;
  let sawTextToken = false;

  tokens.forEach((token) => {
    if (token.startsWith('(') || token.startsWith('<')) {
      const decoded = normalizeInlineWhitespace(decodePdfStringToken(token));

      if (!decoded) {
        return;
      }

      if (pendingSpace && result && !/\s$/.test(result) && !/^[,.;:!?)]/.test(decoded)) {
        result += ' ';
      }

      result += decoded;
      pendingSpace = false;
      sawTextToken = true;
      return;
    }

    if (sawTextToken && Math.abs(Number(token)) >= 250) {
      pendingSpace = true;
    }
  });

  return result;
};

const extractPdfTextFromOperator = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('[')) {
    return extractPdfTextFromArrayOperator(trimmed);
  }

  const tokenMatch = trimmed.match(/^(\((?:\\.|[^\\()])*\)|<[\dA-F\s]+>)/);
  return tokenMatch ? normalizeInlineWhitespace(decodePdfStringToken(tokenMatch[1])) : '';
};

const extractPdfOperatorText = (value: string) => {
  const chunks: string[] = [];
  const operatorMatches = value.matchAll(
    /(\[(?:.|[\r\n])*?\]\s*TJ|(?:\((?:\\.|[^\\()])*\)|<[\dA-F\s]+>)\s*(?:Tj|["']))/g
  );

  for (const match of operatorMatches) {
    const extracted = extractPdfTextFromOperator(match[1]);

    if (extracted) {
      chunks.push(extracted);
    }
  }

  if (chunks.length > 0) {
    return chunks.join('\n');
  }

  return extractPdfStringsFromTextBlock(value).map(normalizeInlineWhitespace).filter(Boolean).join(' ');
};

const binaryStringToBytes = (value: string) => {
  const bytes = new Uint8Array(value.length);

  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index) & 0xff;
  }

  return bytes;
};

const bytesToLatinText = (value: Uint8Array) => new TextDecoder('latin1').decode(value);

const decodeAsciiHexBytes = (value: Uint8Array) => {
  const compact = bytesToLatinText(value)
    .replace(/[^0-9A-F>]/gi, '')
    .replace(/>.*$/g, '')
    .trim();

  if (!compact) {
    return new Uint8Array();
  }

  const evenHex = compact.length % 2 === 0 ? compact : `${compact}0`;
  const bytes = new Uint8Array(evenHex.length / 2);

  for (let index = 0; index < evenHex.length; index += 2) {
    bytes[index / 2] = Number.parseInt(evenHex.slice(index, index + 2), 16);
  }

  return bytes;
};

const decodeAscii85Bytes = (value: Uint8Array) => {
  const source = bytesToLatinText(value);
  const payload = source.includes('~>') ? source.slice(0, source.indexOf('~>')) : source;
  const compact = payload.replace(/\s+/g, '');
  const output: number[] = [];
  let block = '';

  for (const char of compact) {
    if (char === 'z') {
      if (block.length === 0) {
        output.push(0, 0, 0, 0);
      }

      continue;
    }

    block += char;

    if (block.length === 5) {
      let value85 = 0;

      for (const digit of block) {
        value85 = value85 * 85 + (digit.charCodeAt(0) - 33);
      }

      output.push(
        (value85 >>> 24) & 0xff,
        (value85 >>> 16) & 0xff,
        (value85 >>> 8) & 0xff,
        value85 & 0xff
      );
      block = '';
    }
  }

  if (block.length > 0) {
    const padded = block.padEnd(5, 'u');
    let value85 = 0;

    for (const digit of padded) {
      value85 = value85 * 85 + (digit.charCodeAt(0) - 33);
    }

    const remainder = [
      (value85 >>> 24) & 0xff,
      (value85 >>> 16) & 0xff,
      (value85 >>> 8) & 0xff,
      value85 & 0xff,
    ];

    output.push(...remainder.slice(0, block.length - 1));
  }

  return new Uint8Array(output);
};

const inflatePdfStream = async (bytes: Uint8Array) => {
  if (typeof DecompressionStream !== 'undefined') {
    for (const format of ['deflate', 'deflate-raw'] as const) {
      try {
        const stream = new Response(bytes).body;

        if (!stream) {
          break;
        }

        const decompressed = stream.pipeThrough(new DecompressionStream(format));
        const buffer = await new Response(decompressed).arrayBuffer();
        return new Uint8Array(buffer);
      } catch {
        // Try the next deflate flavor or the JS fallback below.
      }
    }
  }

  for (const inflate of [unzlibSync, inflateSync]) {
    try {
      return inflate(bytes);
    } catch {
      // Try the next inflate strategy.
    }
  }

  return undefined;
};

const PDF_FILTER_ALIASES: Record<string, 'FLATEDECODE' | 'ASCIIHEXDECODE' | 'ASCII85DECODE'> = {
  FLATEDECODE: 'FLATEDECODE',
  FL: 'FLATEDECODE',
  ASCIIHEXDECODE: 'ASCIIHEXDECODE',
  AHX: 'ASCIIHEXDECODE',
  ASCII85DECODE: 'ASCII85DECODE',
  A85: 'ASCII85DECODE',
};

const extractPdfFilters = (dictionary: string) => {
  const filterMatch = dictionary.match(/\/FILTER\s*(\[[^\]]+\]|\/[A-Z0-9]+)/i);

  if (!filterMatch) {
    return [];
  }

  return (filterMatch[1].match(/\/([A-Z0-9]+)/gi) ?? [])
    .map((token) => token.replace('/', '').toUpperCase())
    .map((token) => PDF_FILTER_ALIASES[token])
    .filter((token): token is 'FLATEDECODE' | 'ASCIIHEXDECODE' | 'ASCII85DECODE' => Boolean(token));
};

const decodePdfStreamBytes = async (dictionary: string, streamValue: string) => {
  const filters = extractPdfFilters(dictionary);
  let bytes = binaryStringToBytes(streamValue);

  for (const filter of filters) {
    if (filter === 'ASCIIHEXDECODE') {
      bytes = decodeAsciiHexBytes(bytes);
      continue;
    }

    if (filter === 'ASCII85DECODE') {
      bytes = decodeAscii85Bytes(bytes);
      continue;
    }

    const inflated = await inflatePdfStream(bytes);

    if (!inflated) {
      return undefined;
    }

    bytes = inflated;
  }

  return bytes;
};

const extractPdfText = async (bytes: Uint8Array) => {
  const binaryText = bytesToLatinText(bytes);
  const diagnostics = createPdfExtractionDiagnostics(binaryText);
  const textChunks = new Set<string>();
  const directText = extractPdfOperatorText(binaryText);

  if (directText.trim()) {
    textChunks.add(directText);
  }

  const streamMatches = binaryText.matchAll(/<<([\s\S]*?)>>\s*stream\r?\n([\s\S]*?)\r?\nendstream/g);

  for (const match of streamMatches) {
    const dictionary = match[1] ?? '';
    const streamValue = match[2] ?? '';

    if (!streamValue) {
      continue;
    }

    diagnostics.streamCount += 1;
    diagnostics.compressedByteLength += streamValue.length;

    const filters = extractPdfFilters(dictionary);

    if (filters.includes('FLATEDECODE')) {
      diagnostics.flateStreamCount += 1;
    }

    if (filters.length > 1) {
      diagnostics.multiFilterStreamCount += 1;
    }

    const decodedBytes = await decodePdfStreamBytes(dictionary, streamValue);

    if (!decodedBytes) {
      diagnostics.failedStreamCount += 1;
      continue;
    }

    diagnostics.decodedStreamCount += 1;
    diagnostics.decompressedByteLength += decodedBytes.byteLength;

    const decodedText = bytesToLatinText(decodedBytes);
    const extracted = extractPdfOperatorText(decodedText);

    if (extracted.trim()) {
      textChunks.add(extracted);
    }
  }

  return {
    rawText: Array.from(textChunks).join('\n'),
    diagnostics,
  };
};

const extractHeaderProviderName = (normalizedText: string) => {
  const lines = normalizedText
    .split('\n')
    .map((line) => normalizeInlineWhitespace(line))
    .filter(Boolean)
    .slice(0, 18);

  for (const line of lines) {
    if (
      /\b(ENERGIA|ELETRICA|DISTRIBUIDORA|COMPANHIA|CELESC|ENEL|COELBA|EQUATORIAL|LIGHT|CPFL)\b/.test(
        line
      ) &&
      !/\d{4,}/.test(line)
    ) {
      const value = sanitizeProviderName(line);

      if (value) {
        return value;
      }
    }
  }

  return undefined;
};

const collectReadingPairCandidates = (searchText: string) => {
  const previousCandidates: Candidate<number>[] = [];
  const currentCandidates: Candidate<number>[] = [];
  const pairRules = [
    /LEITURA\s+ANTERIOR\s+LEITURA\s+ATUAL\s+([\d.,]+)\s+([\d.,]+)/g,
    /LEITURA\s+ANTERIOR\s*[:\-]?\s*([\d.,]+)\s+(?:LEITURA\s+ATUAL\s*[:\-]?\s*)?([\d.,]+)/g,
    /LEITURA\s+ANT\s*[:\-]?\s*([\d.,]+)\s+(?:LEITURA\s+AT(?:UAL)?\s*[:\-]?\s*)?([\d.,]+)/g,
  ];

  pairRules.forEach((pattern) => {
    for (const match of searchText.matchAll(pattern)) {
      const currentValue = parseReadingNumber(match[2]);
      const normalizedPreviousValue = parseReadingNumber(match[1]);
      const index = match.index ?? Number.MAX_SAFE_INTEGER;

      pushCandidate(previousCandidates, normalizedPreviousValue, 'high', index, validateReading);
      pushCandidate(currentCandidates, currentValue, 'high', index, validateReading);
    }
  });

  return {
      previousCandidates,
      currentCandidates,
    };
};

const collectClientHeaderCandidates = (searchText: string) => {
  const consumerUnitCandidates: Candidate<string>[] = [];
  const referenceMonthCandidates: Candidate<string>[] = [];
  const dueDateCandidates: Candidate<string>[] = [];
  const totalValueCandidates: Candidate<number>[] = [];
  const clientHeaderPattern =
    /(\d{6,})\s+(\d{6,})\s+CLIENTE:\s+((?:0[1-9]|1[0-2])\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})\s+([\d.]+,\d{2})\s+R\$/g;

  for (const match of searchText.matchAll(clientHeaderPattern)) {
    const index = match.index ?? Number.MAX_SAFE_INTEGER;

    pushCandidate(
      consumerUnitCandidates,
      sanitizeConsumerUnit(match[1]),
      'high',
      index
    );
    pushCandidate(
      referenceMonthCandidates,
      normalizeReferenceMonth(match[3]),
      'high',
      index
    );
    pushCandidate(
      dueDateCandidates,
      normalizeDateValue(match[4]),
      'high',
      index
    );
    pushCandidate(
      totalValueCandidates,
      parseBrazilianNumber(match[5]),
      'high',
      index,
      validateCurrency
    );
  }

  return {
    consumerUnitCandidates,
    referenceMonthCandidates,
    dueDateCandidates,
    totalValueCandidates,
  };
};

const collectMeterSequenceCandidates = (searchText: string) => {
  const consumptionCandidates: Candidate<number>[] = [];
  const previousCandidates: Candidate<number>[] = [];
  const currentCandidates: Candidate<number>[] = [];
  const constantCandidates: Candidate<number>[] = [];
  const meterPattern =
    /LIDA\s+\d{4,}\s+ENERGIA\s+[A-Z]+\s+([\d.]+)\s+([\d.]+)\s+([\d.,]+)\s+([\d.,]+)\s+(\d+)\s+(?:LEGENDA|BENEFICIARIO)/g;

  for (const match of searchText.matchAll(meterPattern)) {
    const index = match.index ?? Number.MAX_SAFE_INTEGER;

    pushCandidate(
      previousCandidates,
      parseReadingNumber(match[1]),
      'high',
      index,
      validateReading
    );
    pushCandidate(
      currentCandidates,
      parseReadingNumber(match[2]),
      'high',
      index,
      validateReading
    );
    pushCandidate(
      constantCandidates,
      parseBrazilianNumber(match[3]),
      'high',
      index,
      validateConstant
    );
    pushCandidate(
      consumptionCandidates,
      parseBrazilianNumber(match[5]),
      'high',
      index,
      validateConsumption
    );
  }

  return {
    consumptionCandidates,
    previousCandidates,
    currentCandidates,
    constantCandidates,
  };
};

const extractFieldsFromText = (normalizedText: string): InvoiceParsedFields => {
  const fields = buildEmptyFields();
  const searchText = buildSearchText(normalizedText);
  const { previousCandidates, currentCandidates } = collectReadingPairCandidates(searchText);
  const {
    consumerUnitCandidates,
    referenceMonthCandidates,
    dueDateCandidates,
    totalValueCandidates,
  } = collectClientHeaderCandidates(searchText);
  const {
    consumptionCandidates,
    previousCandidates: meterPreviousCandidates,
    currentCandidates: meterCurrentCandidates,
    constantCandidates,
  } = collectMeterSequenceCandidates(searchText);

  fields.providerName = resolveField([
    ...collectCandidates(searchText, [
      {
        pattern:
          /(?:DISTRIBUIDORA|CONCESSIONARIA|CONCESSIONARIA RESPONSAVEL|FORNECEDORA|RAZAO SOCIAL)\s*[:\-]?\s*([A-Z][A-Z\s.&/-]{3,80})/g,
        confidence: 'high',
        parse: (match) => sanitizeProviderName(match[1]),
      },
      {
        pattern: /BENEFICIARIO\s*:\s*([A-Z][A-Z\s.&/-]{4,80})\s*-\s*CNPJ/g,
        confidence: 'high',
        parse: (match) => sanitizeProviderName(match[1]),
      },
    ]),
    ...(() => {
      const provider = extractHeaderProviderName(normalizedText);
      return provider ? [{ value: provider, confidence: 'low' as const, index: 0 }] : [];
    })(),
  ]);

  fields.consumerUnit = resolveField(
    [
      ...consumerUnitCandidates,
      ...collectCandidates(searchText, [
        {
          pattern:
            /(?:UNIDADE\s+CONSUMIDORA|UNIDADE\s+CLIENTE|NUMERO\s+DA\s+UC|NUMERO\s+UC|N[OU]\s+DA\s+UC|INSTALACAO)\s*[:\-]?\s*([A-Z0-9./-]{4,25})/g,
          confidence: 'high',
          parse: (match) => sanitizeConsumerUnit(match[1]),
        },
        {
          pattern: /\bUC\s*[:\-]?\s*([A-Z0-9./-]{4,25})/g,
          confidence: 'medium',
          parse: (match) => sanitizeConsumerUnit(match[1]),
        },
      ]),
    ]
  );

  fields.referenceMonth = resolveField(
    [
      ...referenceMonthCandidates,
      ...collectCandidates(searchText, [
        {
          pattern:
            /(?:REFERENCIA|MES\/ANO|MES ANO|COMPETENCIA|PERIODO DE REFERENCIA)\s*[:\-]?\s*([A-Z0-9/ -]{4,20})/g,
          confidence: 'high',
          parse: (match) => normalizeReferenceMonth(match[1]),
        },
      ]),
    ]
  );

  fields.issueDate = resolveField(
    collectCandidates(searchText, [
      {
        pattern:
          /(?:DATA\s+DE\s+EMISSAO|EMISSAO|EMITIDA\s+EM)\s*[:\-]?\s*(\d{2}\/\d{2}\/\d{2,4})/g,
        confidence: 'high',
        parse: (match) => normalizeDateValue(match[1]),
      },
    ])
  );

  fields.dueDate = resolveField(
    [
      ...dueDateCandidates,
      ...collectCandidates(searchText, [
        {
          pattern:
            /(?:VENCIMENTO|VCTO|VENCTO|PAGAR\s+ATE|DATA\s+DE\s+VENCIMENTO)\s*[:\-]?\s*(\d{2}\/\d{2}\/\d{2,4})/g,
          confidence: 'high',
          parse: (match) => normalizeDateValue(match[1]),
        },
      ]),
    ]
  );

  fields.totalValue = resolveField(
    [
      ...totalValueCandidates,
      ...collectCandidates(searchText, [
        {
          pattern:
            /(?:TOTAL\s+A\s+PAGAR|VALOR\s+A\s+PAGAR|VALOR\s+TOTAL(?:\s+DA\s+FATURA)?|TOTAL\s+DA\s+FATURA)\s*[:\-]?\s*(R?\$?\s*[\d.,]+)/g,
          confidence: 'high',
          parse: (match) => parseBrazilianNumber(match[1]),
          validate: validateCurrency,
        },
        {
          pattern: /\bTOTAL\b\s*[:\-]?\s*(R?\$?\s*[\d.,]+)/g,
          confidence: 'medium',
          parse: (match) => parseBrazilianNumber(match[1]),
          validate: validateCurrency,
        },
      ]),
    ]
  );

  fields.consumptionKwh = resolveField(
    [
      ...consumptionCandidates,
      ...collectCandidates(searchText, [
        {
          pattern:
            /(?:CONSUMO\s+FATURADO|CONSUMO\s+TOTAL|TOTAL\s+APURADO|ENERGIA\s+ATIVA(?:\s+TOTAL)?)\s*[:\-]?\s*([\d.,]+)\s*KWH\b/g,
          confidence: 'high',
          parse: (match) => parseBrazilianNumber(match[1]),
          validate: validateConsumption,
        },
        {
          pattern: /\bCONSUMO\b\s*[:\-]?\s*([\d.,]+)\s*KWH\b/g,
          confidence: 'medium',
          parse: (match) => parseBrazilianNumber(match[1]),
          validate: validateConsumption,
        },
      ]),
    ]
  );

  fields.daysBilled = resolveField(
    collectCandidates(searchText, [
      {
        pattern: /(?:DIAS\s+FATURADOS|DIAS\s+DE\s+FATURAMENTO|DIAS\s+DE\s+CONSUMO)\s*[:\-]?\s*(\d{1,3})/g,
        confidence: 'high',
        parse: (match) => parseIntegerValue(match[1]),
        validate: validateDays,
      },
      {
        pattern: /\bDIAS\b\s*[:\-]?\s*(\d{1,3})/g,
        confidence: 'low',
        parse: (match) => parseIntegerValue(match[1]),
        validate: validateDays,
      },
    ])
  );

  fields.previousReading = resolveField(
    [
      ...previousCandidates,
      ...meterPreviousCandidates,
      ...collectCandidates(searchText, [
        {
          pattern:
            /(?:LEITURA\s+ANTERIOR|LEITURA\s+ANT)\s*[:\-]?\s*([\d.,]+)/g,
          confidence: 'high',
          parse: (match) => parseReadingNumber(match[1]),
          validate: validateReading,
        },
      ]),
    ]
  );

  fields.currentReading = resolveField(
    [
      ...currentCandidates,
      ...meterCurrentCandidates,
      ...collectCandidates(searchText, [
        {
          pattern: /(?:LEITURA\s+ATUAL|LEITURA\s+AT)\s*[:\-]?\s*([\d.,]+)/g,
          confidence: 'high',
          parse: (match) => parseReadingNumber(match[1]),
          validate: validateReading,
        },
      ]),
    ]
  );

  fields.meterConstant = resolveField(
    [
      ...constantCandidates,
      ...collectCandidates(searchText, [
        {
          pattern: /(?:CONSTANTE(?:\s+DO\s+MEDIDOR)?|MULTIPLICADOR)\s*[:\-]?\s*([\d.,]+)/g,
          confidence: 'high',
          parse: (match) => parseBrazilianNumber(match[1]),
          validate: validateConstant,
        },
      ]),
    ]
  );

  fields.tariffFlag = resolveField(
    collectCandidates(searchText, [
      {
        pattern:
          /(?:BANDEIRA(?:\s+TARIFARIA)?)\s*[:\-]?\s*([A-Z0-9 ]{4,40})/g,
        confidence: 'high',
        parse: (match) => sanitizeTariffFlag(match[1]),
      },
    ])
  );

  fields.teValue = resolveField(
    collectCandidates(searchText, [
      {
        pattern: /\bTE\b[^\dR$]{0,15}(R?\$?\s*[\d.,]+)/g,
        confidence: 'medium',
        parse: (match) => parseBrazilianNumber(match[1]),
        validate: validateCurrency,
      },
    ])
  );

  fields.tusdValue = resolveField(
    collectCandidates(searchText, [
      {
        pattern: /\bTUSD\b[^\dR$]{0,15}(R?\$?\s*[\d.,]+)/g,
        confidence: 'medium',
        parse: (match) => parseBrazilianNumber(match[1]),
        validate: validateCurrency,
      },
    ])
  );

  fields.publicLightingFee = resolveField(
    collectCandidates(searchText, [
      {
        pattern:
          /(?:CIP|COSIP|CONTRIBUICAO\s+ILUMINACAO\s+PUBLICA)\s*[:\-]?\s*(R?\$?\s*[\d.,]+)/g,
        confidence: 'high',
        parse: (match) => parseBrazilianNumber(match[1]),
        validate: validateCurrency,
      },
    ])
  );

  fields.taxesTotal = resolveField(
    collectCandidates(searchText, [
      {
        pattern:
          /(?:TOTAL\s+DE\s+TRIBUTOS|TRIBUTOS|IMPOSTOS)\s*[:\-]?\s*(R?\$?\s*[\d.,]+)/g,
        confidence: 'high',
        parse: (match) => parseBrazilianNumber(match[1]),
        validate: validateCurrency,
      },
    ])
  );

  return applyCrossValidation(fields);
};

const applyCrossValidation = (fields: InvoiceParsedFields) => {
  const adjusted = { ...fields };
  const consumption = adjusted.consumptionKwh.value;
  const previousReading = adjusted.previousReading.value;
  const currentReading = adjusted.currentReading.value;
  const meterConstant = adjusted.meterConstant.value ?? 1;

  if (
    isFiniteNumber(consumption) &&
    isFiniteNumber(previousReading) &&
    isFiniteNumber(currentReading) &&
    currentReading >= previousReading
  ) {
    const computedConsumption = (currentReading - previousReading) * meterConstant;
    const tolerance = Math.max(3, computedConsumption * 0.08);
    const isCoherent = Math.abs(computedConsumption - consumption) <= tolerance;

    if (isCoherent) {
      adjusted.consumptionKwh = {
        value: consumption,
        confidence: upgradeConfidence(adjusted.consumptionKwh.confidence as 'low' | 'medium' | 'high'),
      };
      adjusted.previousReading = {
        value: previousReading,
        confidence: upgradeConfidence(adjusted.previousReading.confidence as 'low' | 'medium' | 'high'),
      };
      adjusted.currentReading = {
        value: currentReading,
        confidence: upgradeConfidence(adjusted.currentReading.confidence as 'low' | 'medium' | 'high'),
      };
    } else {
      adjusted.previousReading = {
        value: previousReading,
        confidence: downgradeConfidence(adjusted.previousReading.confidence as 'low' | 'medium' | 'high'),
      };
      adjusted.currentReading = {
        value: currentReading,
        confidence: downgradeConfidence(adjusted.currentReading.confidence as 'low' | 'medium' | 'high'),
      };
    }
  }

  if (
    isFiniteNumber(adjusted.totalValue.value) &&
    isFiniteNumber(adjusted.taxesTotal.value) &&
    adjusted.taxesTotal.value > adjusted.totalValue.value
  ) {
    adjusted.taxesTotal = {
      value: adjusted.taxesTotal.value,
      confidence: 'low',
    };
  }

  return adjusted;
};

const createAuditSample = (value: string) =>
  value
    .replace(/\r/g, '\n')
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim()
    .slice(0, 500);

const getKeywordPresenceSnapshot = (value: string) => {
  const normalizedValue = value.toUpperCase();

  return {
    REFERENCIA: normalizedValue.includes('REFERENCIA'),
    VENCIMENTO: normalizedValue.includes('VENCIMENTO'),
    CONSUMO: normalizedValue.includes('CONSUMO'),
    KWH: normalizedValue.includes('KWH'),
    'R$': value.includes('R$') || normalizedValue.includes('R$'),
  };
};

const hasUsefulInvoiceKeyword = (value: string) =>
  Object.values(getKeywordPresenceSnapshot(value)).some(Boolean);

const createRelevantAuditLines = (normalizedText: string) =>
  normalizedText
    .split('\n')
    .map((line) => normalizeInlineWhitespace(line))
    .filter(
      (line) =>
        Boolean(line) &&
        (/\b(CLIENTE|REFERENCIA|VENCIMENTO|TOTAL|CONSUMO|KWH|LIDA|LEGENDA|BENEFICIARIO|SUBTOTAL|COSIP|DATA EMISSAO)\b/.test(
          line
        ) ||
          /\b\d{2}\/\d{4}\b/.test(line) ||
          /\b\d{2}\/\d{2}\/\d{4}\b/.test(line))
    )
    .slice(0, 20);

const shouldLogParserAudit = () => {
  const viteDev = Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV);

  if (viteDev) {
    return true;
  }

  return typeof process !== 'undefined' && process.release?.name === 'node' && process.env.NODE_ENV !== 'production';
};

const hasArrayBufferReader = (file: InvoiceFileLike) => typeof file.arrayBuffer === 'function';
const hasTextReader = (file: InvoiceFileLike) => typeof file.text === 'function';

const logParserDebugStage = (stage: string, payload: unknown) => {
  if (!shouldLogParserAudit()) {
    return;
  }

  console.debug(`[invoice-parser] ${stage}`, payload);
};

const logParserAudit = (
  context: {
    source: InvoiceParserResult['textSource'];
    fileName?: string;
    fileType?: string;
    fileSize?: number;
    hasArrayBuffer: boolean;
    hasText: boolean;
    byteLength?: number;
    rawTextLength: number;
    rawTextSample?: string;
  },
  result: InvoiceParserResult
) => {
  if (!shouldLogParserAudit()) {
    return;
  }

  const foundFields = Object.entries(result.fields)
    .filter(([, field]) => field.confidence !== 'missing' && field.value !== undefined)
    .map(([fieldName, field]) => `${fieldName}:${field.confidence}`);
  const missingFields = Object.entries(result.fields)
    .filter(([, field]) => field.confidence === 'missing' || field.value === undefined)
    .map(([fieldName]) => fieldName);

  logParserDebugStage('audit', {
    fileName: context.fileName,
    fileType: context.fileType,
    fileSize: context.fileSize,
    source: context.source,
    hasArrayBuffer: context.hasArrayBuffer,
    hasText: context.hasText,
    byteLength: context.byteLength,
    rawTextLength: context.rawTextLength,
    normalizedTextLength: result.normalizedText.length,
    rawTextSample: context.rawTextSample,
    relevantLines: createRelevantAuditLines(result.normalizedText),
    foundFields,
    missingFields,
  });
};

let pdfJsModulePromise:
  | Promise<{
      getDocument: (src: object) => {
        promise: Promise<{
          numPages: number;
          getPage: (pageNumber: number) => Promise<{
            getTextContent: () => Promise<{
              items: Array<{ str?: string }>;
            }>;
            cleanup: () => void;
          }>;
        }>;
        destroy: () => Promise<void>;
      };
    }>
  | undefined;

const loadPdfJsModule = async () => {
  if (!pdfJsModulePromise) {
    pdfJsModulePromise = (async () => {
      await import('pdfjs-dist/legacy/build/pdf.worker.mjs');
      const pdfJsModule = await import('pdfjs-dist/legacy/build/pdf.mjs');

      return {
        getDocument: pdfJsModule.getDocument,
      };
    })();
  }

  return pdfJsModulePromise;
};

const extractPdfTextWithPdfJs = async (bytes: Uint8Array) => {
  const { getDocument } = await loadPdfJsModule();
  const loadingTask = getDocument({
    data: new Uint8Array(bytes),
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
    stopAtErrors: false,
  });

  try {
    const pdfDocument = await loadingTask.promise;
    const pageTexts: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      const page = await pdfDocument.getPage(pageNumber);

      try {
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => ('str' in item ? item.str ?? '' : ''))
          .filter(Boolean)
          .join('\n');

        if (pageText.trim()) {
          pageTexts.push(pageText);
        }
      } finally {
        page.cleanup();
      }
    }

    return {
      text: pageTexts.join('\n'),
      pageCount: pdfDocument.numPages,
    };
  } finally {
    await loadingTask.destroy();
  }
};

const shouldUsePdfJsFallback = (rawText: string, diagnostics: PdfExtractionDiagnostics) => {
  if (!rawText.trim()) {
    return true;
  }

  if (!hasUsefulInvoiceKeyword(rawText)) {
    return true;
  }

  return (
    rawText.length < 3000 &&
    (diagnostics.toUnicodeCMapCount > 0 ||
      diagnostics.encodedFontObjectCount > 0 ||
      diagnostics.hexTextTokenCount > 0)
  );
};

export const parseInvoiceText = (rawText: string): InvoiceParserResult => {
  const normalizedText = normalizeInvoiceText(rawText);

  logParserDebugStage('raw-text', {
    rawTextLength: rawText.length,
    rawTextSample: createAuditSample(rawText),
    keywordPresence: getKeywordPresenceSnapshot(rawText),
  });

  logParserDebugStage('normalized-text', {
    normalizedTextLength: normalizedText.length,
    normalizedTextSample: createAuditSample(normalizedText),
    keywordPresence: getKeywordPresenceSnapshot(normalizedText),
  });

  if (!normalizedText) {
    return {
      rawTextAvailable: false,
      textSource: 'empty',
      normalizedText,
      fields: buildEmptyFields(),
    };
  }

  return {
    rawTextAvailable: true,
    textSource: 'plain-text',
    normalizedText,
    fields: extractFieldsFromText(normalizedText),
  };
};

export const parseInvoiceFile = async (file: InvoiceFileLike): Promise<InvoiceParserResult> => {
  const fileType = file.type || '';
  const fileName = file.name?.toLowerCase() || '';
  const canReadAsText = hasTextReader(file);
  const canReadAsBytes = hasArrayBufferReader(file);

  if ((fileType === 'text/plain' || fileName.endsWith('.txt')) && canReadAsText) {
    const rawText = await file.text();
    const parsed = parseInvoiceText(rawText);
    logParserAudit(
      {
        fileName: file.name,
        fileType,
        fileSize: file.size,
        source: parsed.textSource,
        hasArrayBuffer: canReadAsBytes,
        hasText: canReadAsText,
        rawTextLength: rawText.length,
        rawTextSample: createAuditSample(rawText),
      },
      parsed
    );
    return parsed;
  }

  if ((fileType === 'application/pdf' || fileName.endsWith('.pdf')) && canReadAsBytes) {
    const bytes = new Uint8Array(await file.arrayBuffer());

    logParserDebugStage('file-read', {
      fileName: file.name,
      fileType,
      fileSize: file.size,
      hasArrayBuffer: canReadAsBytes,
      byteLength: bytes.byteLength,
    });

    const extraction = await extractPdfText(bytes);
    let rawText = extraction.rawText;
    const diagnostics = extraction.diagnostics;

    logParserDebugStage('pdf-structure', diagnostics);

    if (shouldUsePdfJsFallback(rawText, diagnostics)) {
      logParserDebugStage('pdfjs-fallback-started', {
        initialRawTextLength: rawText.length,
        initialKeywordPresence: getKeywordPresenceSnapshot(rawText),
        diagnostics,
      });

      try {
        const fallback = await extractPdfTextWithPdfJs(bytes);

        if (fallback.text.trim()) {
          rawText = fallback.text;
          diagnostics.usedPdfJsFallback = true;
          diagnostics.pdfJsPageCount = fallback.pageCount;
          diagnostics.pdfJsTextLength = fallback.text.length;

          logParserDebugStage('pdfjs-fallback-succeeded', {
            pdfJsPageCount: fallback.pageCount,
            pdfJsTextLength: fallback.text.length,
            keywordPresence: getKeywordPresenceSnapshot(fallback.text),
          });
        }
      } catch (error) {
        logParserDebugStage('pdfjs-fallback-failed', {
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const parsed = parseInvoiceText(rawText);
    const result = {
      ...parsed,
      textSource: parsed.rawTextAvailable ? 'pdf-text' : 'empty',
    };

    logParserAudit(
      {
        fileName: file.name,
        fileType,
        fileSize: file.size,
        source: result.textSource,
        hasArrayBuffer: canReadAsBytes,
        hasText: canReadAsText,
        byteLength: bytes.byteLength,
        rawTextLength: rawText.length,
        rawTextSample: createAuditSample(rawText),
      },
      result
    );

    return result;
  }

  return {
    rawTextAvailable: false,
    textSource: 'unsupported',
    normalizedText: '',
    fields: buildEmptyFields(),
  };
};
