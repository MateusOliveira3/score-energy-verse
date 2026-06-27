import { CheckCircle2, Circle, Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AnalysisSummary,
  EnergyBehaviorProfile,
  EnergyKnowledgeState,
  MascotContextQuestion,
  MascotContextQuestionValue,
  MascotGuidance,
} from '@/types/mvp';
import { EnergyKnowledgeItem } from '@/lib/energyKnowledge';
import {
  compactText,
  InlineKnowledgeFeedbackState,
  InlineMemoryFeedbackState,
} from '@/lib/dynamicContextPanel';

interface DynamicContextKnowledgeViewProps {
  activeKnowledge: EnergyKnowledgeItem | null;
  activeObjective?: string;
  activeTip?: string;
  contextAnalysis?: AnalysisSummary;
  contextMemoryFeedback: InlineMemoryFeedbackState | null;
  contextQuestion?: MascotContextQuestion;
  energyBehaviorProfile: EnergyBehaviorProfile;
  guidance: MascotGuidance;
  knowledgeCatalog: EnergyKnowledgeItem[];
  knowledgeFeedback: InlineKnowledgeFeedbackState | null;
  knowledgeState: EnergyKnowledgeState;
  lastLearnedKnowledge?: EnergyKnowledgeItem;
  learnedKnowledgeCount: number;
  nextKnowledge?: EnergyKnowledgeItem;
  totalKnowledgeCount: number;
  variant: 'mascot' | 'co2';
  onContextQuestionAnswer?: (
    questionId: MascotContextQuestion['id'],
    value: MascotContextQuestionValue
  ) => void;
  onContextQuestionIgnore?: (questionId: MascotContextQuestion['id']) => void;
  onKnowledgeLearned: (knowledgeId: EnergyKnowledgeItem['id'], title: string) => void;
  onOpenActions: () => void;
  onOpenSummary: () => void;
}

const DynamicContextKnowledgeView = ({
  activeKnowledge,
  activeObjective,
  activeTip,
  contextAnalysis,
  contextMemoryFeedback,
  contextQuestion,
  guidance,
  knowledgeCatalog,
  knowledgeFeedback,
  knowledgeState,
  lastLearnedKnowledge,
  learnedKnowledgeCount,
  nextKnowledge,
  totalKnowledgeCount,
  variant,
  onContextQuestionAnswer,
  onContextQuestionIgnore,
  onKnowledgeLearned,
  onOpenActions,
  onOpenSummary,
}: DynamicContextKnowledgeViewProps) => {
  const renderKnowledgeCard = () => {
    if (knowledgeFeedback) {
      return (
        <div className="rounded-[18px] border border-[#365f58] bg-[#113731] p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#c5d8c8]">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#215147] px-2 py-1 font-semibold text-[#8fd08e]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Conhecimento adquirido
            </span>
            <span>{knowledgeFeedback.title}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#d9ead8]">{knowledgeFeedback.message}</p>
          <a
            href="#memory-panel"
            className="mt-3 inline-flex text-xs font-semibold text-[#bfe7bc] underline-offset-4 hover:underline"
          >
            Ver conhecimentos
          </a>
        </div>
      );
    }

    if (!activeKnowledge) {
      return null;
    }

    return (
      <div className="rounded-[18px] border border-[#365f58] bg-[#113731] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9dbfa6]">
          Voce sabia?
        </p>
        <p className="mt-2 text-base font-semibold text-[#f5f8f3]">{activeKnowledge.title}</p>
        <p className="mt-2 text-sm leading-6 text-[#c5d8c8]">{activeKnowledge.message}</p>
        <Button
          size="sm"
          className="mt-3 rounded-[12px] bg-[#5f925c] text-white hover:bg-[#517d4f]"
          onClick={() => onKnowledgeLearned(activeKnowledge.id, activeKnowledge.title)}
        >
          Entendi
        </Button>
      </div>
    );
  };

  if (variant === 'co2') {
    return (
      <div className="flex h-full flex-col gap-4">
        <div className="rounded-[18px] border border-[#365f58] bg-[#163f39] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9dbfa6]">
            Voce sabia?
          </p>
          <p className="mt-2 text-xl font-semibold leading-tight text-[#f5f8f3]">
            {activeKnowledge?.title || activeTip || 'Ponto educativo da jornada'}
          </p>
          <p className="mt-3 text-sm leading-6 text-[#c5d8c8]">
            {activeObjective || 'O CO2 funciona como um atalho de aprendizado, nao como diagnostico.'}
          </p>
        </div>

        <div className="rounded-[18px] border border-[#365f58] bg-[#113731] p-5 text-sm leading-6 text-[#c5d8c8]">
          {compactText(
            activeKnowledge?.message ||
              activeTip ||
              contextAnalysis?.whatMattersNext ||
              guidance.message,
            148
          )}
        </div>

        {renderKnowledgeCard()}

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="rounded-[14px] border-[#365f58] bg-[#163f39] text-[#f5f8f3] hover:bg-[#1b4a43]"
            onClick={onOpenSummary}
          >
            Abrir leitura
          </Button>
          <Button
            className="rounded-[14px] bg-[#5f925c] text-white hover:bg-[#517d4f]"
            onClick={onOpenActions}
          >
            Ver continuidade
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="rounded-[18px] border border-[#365f58] bg-[#163f39] p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#7bc683] text-[#0f342f]">
            <Sprout className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-semibold leading-tight text-[#f5f8f3]">
              Aprendizado Energetico
            </p>
            <p className="text-sm leading-6 text-[#c5d8c8]">
              O mascote organiza o que voce aprendeu com a Score, sem misturar isso com a Memoria Energetica da jornada.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[16px] border border-[#365f58] bg-[#113731] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9dbfa6]">
            Conhecimentos adquiridos
          </div>
          <div className="mt-2 text-2xl font-semibold text-[#f5f8f3]">
            {learnedKnowledgeCount} / {totalKnowledgeCount}
          </div>
          <p className="mt-2 text-sm leading-6 text-[#c5d8c8]">
            Conhecimento Energetico registra o que voce aprendeu com a Score.
          </p>
        </div>
        <div className="rounded-[16px] border border-[#365f58] bg-[#113731] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9dbfa6]">
            Ultimo aprendizado
          </div>
          <div className="mt-2 text-base font-semibold text-[#f5f8f3]">
            {lastLearnedKnowledge?.title || 'Nenhum conhecimento confirmado ainda'}
          </div>
          <p className="mt-2 text-sm leading-6 text-[#c5d8c8]">
            {lastLearnedKnowledge
              ? 'Esse foi o ultimo conteudo marcado como compreendido.'
              : 'Toque em Entendi em um conteudo educativo para registrar o primeiro conhecimento.'}
          </p>
        </div>
      </div>

      {knowledgeFeedback ? (
        <div className="rounded-[18px] border border-[#365f58] bg-[#113731] p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#c5d8c8]">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#215147] px-2 py-1 font-semibold text-[#8fd08e]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Conhecimento adquirido
            </span>
            <span>{knowledgeFeedback.title}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#d9ead8]">{knowledgeFeedback.message}</p>
          <a
            href="#memory-panel"
            className="mt-3 inline-flex text-xs font-semibold text-[#bfe7bc] underline-offset-4 hover:underline"
          >
            Ver memoria e conhecimento
          </a>
        </div>
      ) : nextKnowledge ? (
        <div className="rounded-[18px] border border-[#365f58] bg-[#113731] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9dbfa6]">
            Proximo aprendizado
          </p>
          <p className="mt-2 text-base font-semibold text-[#f5f8f3]">{nextKnowledge.title}</p>
          <p className="mt-2 text-sm leading-6 text-[#c5d8c8]">{nextKnowledge.message}</p>
          <Button
            size="sm"
            className="mt-3 rounded-[12px] bg-[#5f925c] text-white hover:bg-[#517d4f]"
            onClick={() => onKnowledgeLearned(nextKnowledge.id, nextKnowledge.title)}
          >
            Entendi
          </Button>
        </div>
      ) : null}

      <div className="rounded-[18px] border border-[#365f58] bg-[#113731] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9dbfa6]">
              O que voce ja aprendeu
            </p>
            <p className="mt-2 text-sm leading-6 text-[#c5d8c8]">
              O mascote ensina. O painel abaixo mostra quais conhecimentos ja foram apresentados e compreendidos.
            </p>
          </div>
          <a
            href="#memory-panel"
            className="text-xs font-semibold text-[#bfe7bc] underline-offset-4 hover:underline"
          >
            Ver painel completo
          </a>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {knowledgeCatalog.map((knowledge) => {
            const isLearned = knowledgeState.learned[knowledge.id] === true;

            return (
              <div
                key={knowledge.id}
                className="flex items-start gap-3 rounded-[14px] border border-[#2d5b54] bg-[#123f39] px-3 py-3"
              >
                {isLearned ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#8fd08e]" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-[#9dbfa6]" />
                )}
                <div>
                  <p className="text-sm font-medium text-[#f5f8f3]">{knowledge.title}</p>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[#9dbfa6]">
                    {knowledge.category.replaceAll('_', ' ')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {contextQuestion && (
        <div className="rounded-[18px] border border-[#365f58] bg-[#113731] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9dbfa6]">
            Pergunta estrategica
          </p>
          <p className="mt-2 text-sm font-medium leading-6 text-[#f5f8f3]">
            {contextQuestion.question}
          </p>
          <p className="mt-2 text-sm leading-6 text-[#c5d8c8]">
            Essa resposta continua aqui porque personaliza recomendacoes. Ela nao faz parte do conteudo educativo.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {contextQuestion.options.map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant="outline"
                className="rounded-[12px] border-[#365f58] bg-[#163f39] text-[#f5f8f3] hover:bg-[#1b4a43]"
                onClick={() => onContextQuestionAnswer?.(contextQuestion.id, option.value)}
              >
                {option.label}
              </Button>
            ))}
            <Button
              size="sm"
              variant="ghost"
              className="rounded-[12px] text-[#c5d8c8] hover:bg-[#18453f] hover:text-[#f5f8f3]"
              onClick={() => onContextQuestionIgnore?.(contextQuestion.id)}
            >
              Agora nao
            </Button>
          </div>
        </div>
      )}

      {contextMemoryFeedback && (
        <div className="rounded-[18px] border border-[#365f58] bg-[#113731] p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#c5d8c8]">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#215147] px-2 py-1 font-semibold text-[#8fd08e]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {contextMemoryFeedback.title}
            </span>
            <span>{contextMemoryFeedback.message}</span>
          </div>
          {contextMemoryFeedback.ctaLabel && (
            <a
              href="#memory-panel"
              className="mt-3 inline-flex text-xs font-semibold text-[#bfe7bc] underline-offset-4 hover:underline"
            >
              {contextMemoryFeedback.ctaLabel}
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default DynamicContextKnowledgeView;
