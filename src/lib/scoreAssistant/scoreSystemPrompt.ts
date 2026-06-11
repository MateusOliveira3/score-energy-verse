import type { ScoreAssistantContextSnapshot, ScoreAssistantUserContext } from './types';

const joinLines = (label: string, values: string[]) =>
  values.length > 0 ? `- ${label}: ${values.join('; ')}` : `- ${label}: indisponivel`;

export const SCORE_SYSTEM_PROMPT_BASE = `Voce e o assistente energetico da Score Energy.

A Score existe para tornar inteligentes as decisoes de quem consome energia.

Seu papel nao e apenas responder.
Seu papel e ensinar, contextualizar e ajudar o usuario a tomar decisoes melhores sobre energia.

Regras:
1. Responda em portugues do Brasil.
2. Seja claro, humano e educativo.
3. Nunca invente dados.
4. Se faltarem dados, diga o que falta.
5. Explique causa e consequencia.
6. Sempre que possivel, conecte habitos, cargas, horarios e fatura.
7. Nao prometa economia exata sem dados suficientes.
8. Nao exponha detalhes tecnicos internos.
9. Nao diga "vou carregar uma skill".
10. Nao fale como robo.
11. Nao use jargao sem explicar.
12. Priorize entendimento antes de recomendacao.
13. Toda resposta deve deixar o usuario mais inteligente sobre energia.`;

export const formatScoreAssistantContext = (context?: ScoreAssistantContextSnapshot) => {
  if (!context || !context.hasMemoryContext) {
    return '[SCORE_CONTEXT vazio: ainda ha pouco contexto energetico disponivel.]';
  }

  return [
    '[SCORE_CONTEXT',
    context.activeView ? `- View ativa: ${context.activeView}` : '- View ativa: indisponivel',
    context.selectedInvoiceLabel
      ? `- Fatura em foco: ${context.selectedInvoiceLabel}`
      : '- Fatura em foco: indisponivel',
    context.scoreSummary ? `- Score atual: ${context.scoreSummary}` : '- Score atual: indisponivel',
    joinLines('Perfil conhecido', context.userProfileSummary),
    joinLines('Historico de faturas', context.invoiceHistorySummary),
    context.comparisonSummary
      ? `- Comparacao entre ciclos: ${context.comparisonSummary}`
      : '- Comparacao entre ciclos: ainda insuficiente',
    joinLines('Sinais de memoria energetica', context.memorySignals),
    joinLines('Sinais energeticos observados', context.energySignals),
    joinLines('Conhecimentos aprendidos', context.learnedKnowledge),
    joinLines('Acoes recentes', context.recentActions),
    joinLines('Lacunas conhecidas', context.knownGaps),
    joinLines('Hipoteses de carga', context.loadHypotheses),
    context.suggestedNextAction
      ? `- Proxima acao sugerida: ${context.suggestedNextAction}`
      : '- Proxima acao sugerida: indisponivel',
    ']',
  ].join('\n');
};

export const buildScoreSystemPrompt = ({
  context,
  skillNotes = [],
  user,
}: {
  context?: ScoreAssistantContextSnapshot;
  skillNotes?: string[];
  user: ScoreAssistantUserContext;
}) => {
  const sessionBlock = `[SCORE_SESSION userId=${user.userId} name=${user.userName} role=${user.role}]`;
  const skillsBlock =
    skillNotes.length > 0
      ? `\n\nConhecimento interno disponivel:\n${skillNotes
          .map((note) => `- ${note}`)
          .join('\n')}`
      : '';

  return `${SCORE_SYSTEM_PROMPT_BASE}

Contexto da sessao:
${sessionBlock}

Contexto energetico disponivel:
${formatScoreAssistantContext(context)}${skillsBlock}`;
};
