// server/lib/energy-advisor.ts
import { InvoiceParsed, DiagnosisResult, asNumberOrZero } from './types.js';
import { getSeasonalInsight } from './seasonal-insights.js';

/**
 * Módulo consultivo: transforma um InvoiceParsed em recomendações (tips) e tags.
 * - Função pura (sem I/O).
 * - Não lança exceções; sempre retorna dicas mínimas.
 * - Logs leves com prefixo [ADVISOR] apenas se necessário.
 */

type TipLevel = 'positivo' | 'atencao' | 'risco';
interface TipItem { level: TipLevel; text: string; tag?: string; }

// Limiar configuráveis (mantidos aqui por simplicidade)
const LIMITS = {
  consumoAtencao: 200,   // kWh
  consumoRisco: 300,     // kWh
  kwhCaro: 1.00,         // R$/kWh
  kwhBarato: 0.80,       // R$/kWh (informativo)
  cipAlta: 50            // R$
};

function buildTip(level: TipLevel, text: string, tag?: string): TipItem {
  return { level, text, tag };
}

function toUserText(items: TipItem[]): string[] {
  // mapeia para mensagens com ícones
  return items.map(it => {
    const icon = it.level === 'risco' ? '🔴' : it.level === 'atencao' ? '🟡' : '🟢';
    return `${icon} ${it.text}`;
  });
}

/**
 * Gera recomendações consultivas com base em regras simples e transparentes.
 */
export function diagnosticoEnergetico(inv: InvoiceParsed, userState?: string): DiagnosisResult {
  const tips: TipItem[] = [];
  const tags: string[] = [];

  const c   = asNumberOrZero(inv.consumption_kwh);
  const v   = asNumberOrZero(inv.total_value_brl);
  const vpk = asNumberOrZero(inv.value_per_kwh);
  const cip = asNumberOrZero(inv.publicLightingContribution);

  // 1) Consumo
  if (c >= LIMITS.consumoRisco) {
    tips.push(buildTip('risco', 'Consumo muito elevado. Reduza picos e avalie equipamentos antigos.', 'consumo_muito_alto'));
    tags.push('consumo_muito_alto');
  } else if (c >= LIMITS.consumoAtencao) {
    tips.push(buildTip('atencao', 'Consumo acima da média. Ajuste hábitos e eficiência.', 'consumo_alto'));
    tags.push('consumo_alto');
  } else {
    tips.push(buildTip('positivo', 'Bom controle de consumo. Continue assim!', 'consumo_ok'));
    tags.push('consumo_ok');
  }

  // 2) Energia reativa (multa/baixo FP)
  if (inv.has_reactive) {
    tips.push(buildTip('risco', 'Multa por energia reativa detectada. Instale banco de capacitores para eliminar o custo recorrente.', 'reativo'));
    tags.push('reativo');
  }

  // 3) Geração distribuída (GD)
  if (!inv.has_gd) {
    tips.push(buildTip('atencao', 'Sem GD no período. Avalie viabilidade de energia solar para reduzir a fatura.', 'sem_gd'));
    tags.push('sem_gd');
  } else {
    // informação positiva opcional
    tips.push(buildTip('positivo', 'Geração distribuída ativa. Bom para reduzir sua conta!', 'gd_ok'));
    tags.push('gd_ok');
  }

  // 4) Valor por kWh
  if (vpk >= LIMITS.kwhCaro) {
    tips.push(buildTip('atencao', 'Custo por kWh elevado. Revise hábitos e avalie se a estrutura tarifária está adequada.', 'kwh_caro'));
    tags.push('kwh_caro');
  } else if (vpk > 0 && vpk <= LIMITS.kwhBarato) {
    tips.push(buildTip('positivo', 'Bom custo por kWh. Mantenha os hábitos e monitore.', 'kwh_bom'));
    tags.push('kwh_bom');
  }

  // 5) Tarifa (heurística simples)
  const tariff = (inv.tariff || '').toLowerCase();
  if (tariff.includes('convencional')) {
    // sem medir perfil horário ainda, só orienta avaliação
    tips.push(buildTip('atencao', 'Tarifa Convencional identificada. Se o uso for majoritariamente fora de ponta, considere Tarifa Branca.', 'avaliar_tarifa'));
    tags.push('avaliar_tarifa');
  }

  // 6) CIP (opcional, se disponível)
  if (cip > LIMITS.cipAlta) {
    tips.push(buildTip('atencao', 'Contribuição de iluminação pública alta. Verifique regras locais para possíveis ajustes.', 'cip_alta'));
    tags.push('cip_alta');
  }

  // 7) Coerência básica
  if (c === 0 && v > 0) {
    tips.push(buildTip('atencao', 'Valor positivo com consumo zero. Revise a leitura/extração da fatura.', 'verificar_parse'));
    tags.push('verificar_parse');
  }

  // Sempre garantir ao menos uma dica
  if (tips.length === 0) {
    tips.push(buildTip('positivo', 'Fatura analisada sem anomalias. Bom desempenho!','ok'));
    tags.push('ok');
  }

  // Insights sazonais baseados no estado do usuário e mês da fatura
  if (userState && inv.month) {
    const { season, insight } = getSeasonalInsight(userState, Number(inv.month));
    tips.push(buildTip('atencao', `Sazonal (${season}): ${insight}`, 'sazonal'));
    tags.push('sazonal');
  }

  const result: DiagnosisResult = {
    tips: toUserText(tips),
    tags
  };

  // console.log('[ADVISOR] Result:', result); // mantenha comentado para evitar ruído
  return result;
}

export default diagnosticoEnergetico;
