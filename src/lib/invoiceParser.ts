import {
  InvoiceFieldConfidence,
  InvoiceParsedField,
  InvoiceParsedFields,
  InvoiceParserResult,
} from '@/types/mvp';

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
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .toUpperCase()
    .trim();

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

const parseIntegerValue = (value: string): number | undefined => {
  const parsed = parseBrazilianNumber(value);

  if (!isFiniteNumber(parsed)) {
    return undefined;
  }

  return Math.round(parsed);
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
    /\b(VERDE|AMARELA|VERMELHA(?: PATAMAR ?[12])?|ESCASSEZ HIDRICA|SEM BANDEIRA)\b/
  );

  return knownFlag?.[0] ?? cleaned;
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

const extractPdfOperatorText = (value: string) => {
  const chunks: string[] = [];
  const operatorMatches = value.matchAll(
    /(\[(?:.|[\r\n])*?\]\s*TJ|\((?:\\.|[^\\()])*\)\s*Tj|\((?:\\.|[^\\()])*\)\s*["'])/g
  );

  for (const match of operatorMatches) {
    chunks.push(...extractPdfStringsFromTextBlock(match[1]));
  }

  if (chunks.length > 0) {
    return chunks.join('\n');
  }

  return extractPdfStringsFromTextBlock(value).join('\n');
};

const binaryStringToBytes = (value: string) => {
  const bytes = new Uint8Array(value.length);

  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index) & 0xff;
  }

  return bytes;
};

const inflatePdfStream = async (bytes: Uint8Array) => {
  if (typeof DecompressionStream === 'undefined') {
    return undefined;
  }

  try {
    const stream = new Response(bytes).body;

    if (!stream) {
      return undefined;
    }

    const decompressed = stream.pipeThrough(new DecompressionStream('deflate'));
    const buffer = await new Response(decompressed).arrayBuffer();
    return new Uint8Array(buffer);
  } catch {
    return undefined;
  }
};

const extractPdfText = async (bytes: Uint8Array) => {
  const latinDecoder = new TextDecoder('latin1');
  const binaryText = latinDecoder.decode(bytes);
  const textChunks = new Set<string>();
  const directText = extractPdfOperatorText(binaryText);

  if (directText.trim()) {
    textChunks.add(directText);
  }

  const streamMatches = binaryText.matchAll(/<<(.*?)>>\s*stream\r?\n([\s\S]*?)\r?\nendstream/g);

  for (const match of streamMatches) {
    const dictionary = match[1] ?? '';
    const streamValue = match[2] ?? '';

    if (!streamValue) {
      continue;
    }

    const sourceBytes = binaryStringToBytes(streamValue);
    let decodedBytes = sourceBytes;

    if (/\/FLATEDECODE/i.test(dictionary)) {
      const inflated = await inflatePdfStream(sourceBytes);

      if (inflated) {
        decodedBytes = inflated;
      } else {
        continue;
      }
    }

    const decodedText = latinDecoder.decode(decodedBytes);
    const extracted = extractPdfOperatorText(decodedText);

    if (extracted.trim()) {
      textChunks.add(extracted);
    }
  }

  return Array.from(textChunks).join('\n');
};

const extractHeaderProviderName = (normalizedText: string) => {
  const lines = normalizedText.split('\n').slice(0, 12);

  for (const line of lines) {
    if (/\b(ENERGIA|ELETRICA|DISTRIBUIDORA|COMPANHIA)\b/.test(line) && !/\d{4,}/.test(line)) {
      const value = sanitizeProviderName(line);

      if (value) {
        return value;
      }
    }
  }

  return undefined;
};

const extractFieldsFromText = (normalizedText: string): InvoiceParsedFields => {
  const fields = buildEmptyFields();

  fields.providerName = resolveField([
    ...collectCandidates(normalizedText, [
      {
        pattern:
          /(?:DISTRIBUIDORA|CONCESSIONARIA|CONCESSIONARIA RESPONSAVEL|FORNECEDORA)\s*[:\-]?\s*([A-Z][A-Z\s.&/-]{3,80})/g,
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
    collectCandidates(normalizedText, [
      {
        pattern:
          /(?:UNIDADE\s+CONSUMIDORA|UNIDADE\s+CLIENTE|NUMERO\s+DA\s+UC|INSTALACAO)\s*[:\-]?\s*([A-Z0-9./-]{4,25})/g,
        confidence: 'high',
        parse: (match) => sanitizeConsumerUnit(match[1]),
      },
      {
        pattern: /\bUC\s*[:\-]?\s*([A-Z0-9./-]{4,25})/g,
        confidence: 'medium',
        parse: (match) => sanitizeConsumerUnit(match[1]),
      },
    ])
  );

  fields.referenceMonth = resolveField(
    collectCandidates(normalizedText, [
      {
        pattern:
          /(?:REFERENCIA|MES\/ANO|MES ANO|COMPETENCIA|PERIODO DE REFERENCIA)\s*[:\-]?\s*([A-Z0-9/ -]{4,20})/g,
        confidence: 'high',
        parse: (match) => normalizeReferenceMonth(match[1]),
      },
    ])
  );

  fields.issueDate = resolveField(
    collectCandidates(normalizedText, [
      {
        pattern:
          /(?:DATA\s+DE\s+EMISSAO|EMISSAO|EMITIDA\s+EM)\s*[:\-]?\s*(\d{2}\/\d{2}\/\d{2,4})/g,
        confidence: 'high',
        parse: (match) => normalizeDateValue(match[1]),
      },
    ])
  );

  fields.dueDate = resolveField(
    collectCandidates(normalizedText, [
      {
        pattern:
          /(?:VENCIMENTO|VCTO|VENCTO|PAGAR\s+ATE|DATA\s+DE\s+VENCIMENTO)\s*[:\-]?\s*(\d{2}\/\d{2}\/\d{2,4})/g,
        confidence: 'high',
        parse: (match) => normalizeDateValue(match[1]),
      },
    ])
  );

  fields.totalValue = resolveField(
    collectCandidates(normalizedText, [
      {
        pattern:
          /(?:TOTAL\s+A\s+PAGAR|VALOR\s+TOTAL(?:\s+DA\s+FATURA)?|TOTAL\s+DA\s+FATURA)\s*[:\-]?\s*(R?\$?\s*[\d.,]+)/g,
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
    ])
  );

  fields.consumptionKwh = resolveField(
    collectCandidates(normalizedText, [
      {
        pattern:
          /(?:CONSUMO\s+FATURADO|CONSUMO\s+TOTAL|TOTAL\s+APURADO|ENERGIA\s+ATIVA)\s*[:\-]?\s*([\d.,]+)\s*KWH\b/g,
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
    ])
  );

  fields.daysBilled = resolveField(
    collectCandidates(normalizedText, [
      {
        pattern: /(?:DIAS\s+FATURADOS|DIAS\s+DE\s+FATURAMENTO)\s*[:\-]?\s*(\d{1,3})/g,
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
    collectCandidates(normalizedText, [
      {
        pattern:
          /(?:LEITURA\s+ANTERIOR|LEITURA\s+ANT)\s*[:\-]?\s*([\d.,]+)/g,
        confidence: 'high',
        parse: (match) => parseBrazilianNumber(match[1]),
        validate: validateReading,
      },
    ])
  );

  fields.currentReading = resolveField(
    collectCandidates(normalizedText, [
      {
        pattern: /(?:LEITURA\s+ATUAL|LEITURA\s+AT)\s*[:\-]?\s*([\d.,]+)/g,
        confidence: 'high',
        parse: (match) => parseBrazilianNumber(match[1]),
        validate: validateReading,
      },
    ])
  );

  fields.meterConstant = resolveField(
    collectCandidates(normalizedText, [
      {
        pattern: /(?:CONSTANTE(?:\s+DO\s+MEDIDOR)?|MULTIPLICADOR)\s*[:\-]?\s*([\d.,]+)/g,
        confidence: 'high',
        parse: (match) => parseBrazilianNumber(match[1]),
        validate: validateConstant,
      },
    ])
  );

  fields.tariffFlag = resolveField(
    collectCandidates(normalizedText, [
      {
        pattern:
          /(?:BANDEIRA(?:\s+TARIFARIA)?)\s*[:\-]?\s*([A-Z ]{4,40})/g,
        confidence: 'high',
        parse: (match) => sanitizeTariffFlag(match[1]),
      },
    ])
  );

  fields.teValue = resolveField(
    collectCandidates(normalizedText, [
      {
        pattern: /\bTE\b[^\dR$]{0,15}(R?\$?\s*[\d.,]+)/g,
        confidence: 'medium',
        parse: (match) => parseBrazilianNumber(match[1]),
        validate: validateCurrency,
      },
    ])
  );

  fields.tusdValue = resolveField(
    collectCandidates(normalizedText, [
      {
        pattern: /\bTUSD\b[^\dR$]{0,15}(R?\$?\s*[\d.,]+)/g,
        confidence: 'medium',
        parse: (match) => parseBrazilianNumber(match[1]),
        validate: validateCurrency,
      },
    ])
  );

  fields.publicLightingFee = resolveField(
    collectCandidates(normalizedText, [
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
    collectCandidates(normalizedText, [
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

export const parseInvoiceText = (rawText: string): InvoiceParserResult => {
  const normalizedText = normalizeInvoiceText(rawText);

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

export const parseInvoiceFile = async (file: File): Promise<InvoiceParserResult> => {
  const fileType = file.type || '';
  const fileName = file.name.toLowerCase();

  if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
    const rawText = await file.text();
    return parseInvoiceText(rawText);
  }

  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const rawText = await extractPdfText(bytes);
    const parsed = parseInvoiceText(rawText);

    return {
      ...parsed,
      textSource: parsed.rawTextAvailable ? 'pdf-text' : 'empty',
    };
  }

  return {
    rawTextAvailable: false,
    textSource: 'unsupported',
    normalizedText: '',
    fields: buildEmptyFields(),
  };
};
