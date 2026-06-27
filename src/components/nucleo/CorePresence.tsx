import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CoreExperience } from '@/lib/cognitive';
import {
  GuidedConversationActionQuestion,
  GuidedConversationContextQuestion,
  GuidedFirstReading,
  GuidedConversationQuestion,
  GuidedConversationViewModel,
} from '@/lib/guidedConversation';
import type { ProductRuntime } from '@/lib/productRuntime';
import { MascotContextQuestionValue } from '@/types/mvp';

type DetailSectionKey = 'profile' | 'summary' | 'actions' | 'history' | 'memory';

export interface CorePresenceFeedback {
  continueLabel?: string;
  evidenceLine?: string;
  helperText?: string;
  hypothesisLine?: string;
  memoryLinkLabel?: string;
  message: string;
  productRuntime?: ProductRuntime;
  reading?: GuidedFirstReading;
  supportLine?: string;
  title: string;
  uncertaintyLine?: string;
}

type CorePresenceVariant = 'aside' | 'hero';

interface CorePresenceProps {
  experience?: CoreExperience;
  feedback: CorePresenceFeedback | null;
  onActionQuestionAnswer: (question: GuidedConversationActionQuestion, value: string) => void;
  onContextQuestionAnswer: (
    question: GuidedConversationContextQuestion,
    value: MascotContextQuestionValue
  ) => void;
  onContextQuestionIgnore: (question: GuidedConversationContextQuestion) => void;
  onFeedbackContinue?: () => void;
  onOpenDetails: (section: DetailSectionKey) => void;
  variant?: CorePresenceVariant;
  viewModel: GuidedConversationViewModel;
}

const CoreGlyph = () => (
  <div className="relative flex h-[74px] w-[74px] items-center justify-center">
    <span className="absolute h-16 w-16 rounded-full border border-[#6ad699]/18 bg-[radial-gradient(circle,rgba(43,194,116,0.12),transparent_70%)]" />
    <span className="absolute h-10 w-10 rounded-full border border-[#7fe3ae]/30 bg-[radial-gradient(circle_at_35%_30%,#74f0ad_0%,#1ca664_52%,#0b6038_100%)] shadow-[0_0_26px_rgba(43,194,116,0.35)] [animation:score-breathe_4.8s_ease-in-out_infinite]" />
    <span className="absolute h-2.5 w-2.5 rounded-full bg-white/90 shadow-[0_0_14px_rgba(255,255,255,0.45)]" />
  </div>
);

const CorePresence = ({
  experience,
  feedback,
  onActionQuestionAnswer,
  onContextQuestionAnswer,
  onContextQuestionIgnore,
  onFeedbackContinue,
  onOpenDetails,
  variant = 'aside',
  viewModel,
}: CorePresenceProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const runtimeExperience = viewModel.state === 'ready' ? experience : undefined;
  const isHero = variant === 'hero';
  const baseRuntime = viewModel.productRuntime;
  const readingRuntime = viewModel.firstReading?.productRuntime;
  const feedbackRuntime = feedback?.productRuntime ?? feedback?.reading?.productRuntime;
  const activeRuntime = feedbackRuntime ?? readingRuntime ?? baseRuntime;
  const surfaceRuntime = activeRuntime?.experience;

  React.useEffect(() => {
    setIsOpen(Boolean(feedback));
  }, [experience?.id, feedback, viewModel.sessionKey]);

  const activeQuestion = !feedback ? viewModel.currentQuestion : undefined;
  const question = !feedback ? readingRuntime?.experience.hermes.question : undefined;
  const heroHeading = feedback
    ? feedback.title
    : surfaceRuntime?.hermes.line
      ? surfaceRuntime.hermes.line
      : runtimeExperience?.speech.opening || viewModel.corePresence.cue;
  const heroDetailLine = feedback
    ? feedback.message
    : surfaceRuntime?.score.discovery?.headline
      ? surfaceRuntime.score.discovery.headline
      : runtimeExperience
      ? question
        ? runtimeExperience.speech.clueLine
        : runtimeExperience.speech.source === 'energy_story'
          ? runtimeExperience.speech.clueLine
          : runtimeExperience.primaryClue.explanation
      : viewModel.corePresence.detail || viewModel.corePresence.idleLine;
  const heroSupportLine = feedback?.supportLine || (!feedback ? surfaceRuntime?.score.meaning : undefined);
  const hasExpandableContent = Boolean(
    feedback ||
      runtimeExperience ||
      question ||
      surfaceRuntime?.score.deepReading.available ||
      viewModel.corePresence.detail ||
      viewModel.corePresence.memoryLine ||
      viewModel.state === 'profile' ||
      viewModel.state === 'upload'
  );
  const heroQuestionPrompt = question?.prompt;
  const heroQuestionHelper = question?.helperText;
  const shouldShowPrimaryActionButton = Boolean(
    readingRuntime?.cta?.target === 'deep_reading' && !question
  );
  const ctaLabel = feedback
    ? activeRuntime?.experience.score.deepReading.label || 'Ver'
    : isHero && heroQuestionPrompt
      ? 'Responder'
    : question
      ? readingRuntime?.experience.score.deepReading.label || 'Ver'
      : viewModel.state === 'profile' || viewModel.state === 'upload'
        ? 'Ver'
        : activeRuntime?.cta
          ? activeRuntime.cta.label
          : runtimeExperience
            ? runtimeExperience.primaryAction.label
            : viewModel.corePresence.detail || viewModel.corePresence.memoryLine
              ? 'Ver'
              : 'Ver mais';
  const detailSection: DetailSectionKey = feedback?.memoryLinkLabel
    ? 'memory'
    : activeRuntime?.experience.score.deepReading.target ||
      (runtimeExperience?.secondaryActions.includes('ver_memoria')
        ? 'memory'
        : 'summary');

  const handleAnswer = React.useCallback(
    (activeQuestion: GuidedConversationQuestion, value: string) => {
      if (activeQuestion.kind === 'context') {
        onContextQuestionAnswer(activeQuestion, value);
        return;
      }

      onActionQuestionAnswer(activeQuestion, value);
    },
    [onActionQuestionAnswer, onContextQuestionAnswer]
  );

  const runtimePrimaryButton = (readingRuntime || runtimeExperience) && (
    <Button
      className="rounded-full bg-white text-[#0f4035] hover:bg-[#e8f3eb]"
      onClick={() => {
        if (question) {
          setIsOpen(true);
          return;
        }

        if (shouldShowPrimaryActionButton) {
          setIsOpen((currentValue) => !currentValue);
        }
      }}
    >
      {readingRuntime?.cta?.label || runtimeExperience?.primaryAction.label || 'Ver mais sobre esta conta'}
      <ArrowRight className="h-4 w-4" />
    </Button>
  );

  return (
    <aside className={isHero ? 'w-full' : 'self-end xl:self-center'}>
      <div className={isHero ? 'w-full' : 'mx-auto max-w-[320px]'}>
        <div
          data-cognitive-question-id={question?.id}
          data-cognitive-stage={feedback ? 'value-return' : question ? 'question' : 'observation'}
          className={`relative overflow-hidden border border-white/10 bg-black/12 backdrop-blur-sm ${
            isHero ? 'rounded-[28px] px-4 py-5 sm:px-6 sm:py-6' : 'rounded-[24px] px-4 py-5'
          }`}
        >
          <div className="absolute inset-x-8 top-3 h-20 rounded-full bg-[radial-gradient(circle,rgba(43,194,116,0.16)_0%,transparent_72%)] blur-2xl" />
          <div className={`relative z-10 ${isHero ? 'space-y-5' : 'space-y-4'}`}>
            <div className={`flex ${isHero ? 'items-start gap-4' : 'items-center gap-3'}`}>
              <div className="shrink-0">
                <CoreGlyph />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9dd8b1]">
                  Core
                </p>
                {isHero ? (
                  <>
                    <h2 className="score-display mt-2 max-w-[12ch] text-3xl font-bold leading-[0.96] text-white sm:text-[2.65rem]">
                      {heroHeading}
                    </h2>
                    {heroDetailLine && (
                      <p className="mt-3 max-w-xl text-sm leading-6 text-white/78 sm:text-[15px] sm:leading-7">
                        {heroDetailLine}
                      </p>
                    )}
                {heroSupportLine && (
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/58">
                    {heroSupportLine}
                  </p>
                )}
                  </>
                ) : (
                  <p className="text-sm leading-6 text-white/82">
                    {feedback
                      ? surfaceRuntime?.hermes.line || 'Anotei isso para seguir com a leitura.'
                      : surfaceRuntime?.hermes.line ||
                        runtimeExperience?.speech.opening ||
                        viewModel.corePresence.cue}
                  </p>
                )}
              </div>
            </div>

            {isHero && !feedback && heroQuestionPrompt && (
              <div
                data-cognitive-stage="question"
                className="max-w-xl rounded-[20px] border border-white/10 bg-white/6 px-4 py-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9dd8b1]">
                  Pergunta curta
                </p>
                <p className="mt-2 text-base leading-7 text-white sm:text-lg">
                  {heroQuestionPrompt}
                </p>
                {heroQuestionHelper && (
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/68">
                    {heroQuestionHelper}
                  </p>
                )}
                {question && activeQuestion && (
                  <div className="mt-4 grid gap-2 sm:max-w-[460px] sm:grid-cols-3">
                    {question.options.map((option) => (
                      <Button
                        key={`${activeQuestion.id}-${option.value}`}
                        variant="outline"
                        className="h-auto justify-center rounded-[16px] border-white/12 bg-white/6 px-4 py-3 text-center text-white hover:bg-white/12 hover:text-white"
                        onClick={() => handleAnswer(activeQuestion, option.value)}
                      >
                        <span className="text-sm font-semibold leading-6">{option.label}</span>
                      </Button>
                    ))}
                  </div>
                )}
                {question?.kind === 'context' && activeQuestion?.kind === 'context' && (
                  <button
                    type="button"
                    className="mt-3 text-left text-sm text-white/64 underline-offset-4 hover:text-white hover:underline"
                    onClick={() => onContextQuestionIgnore(activeQuestion)}
                  >
                    Agora nao
                  </button>
                )}
              </div>
            )}

            {((isOpen && !isHero) || (isHero && isOpen)) && (
              <div className="space-y-3 border-t border-white/10 pt-4 text-sm leading-6 text-white/74">
                {feedback ? (
                  <div data-cognitive-stage="value-return" className="space-y-3">
                    {feedback.reading && (
                      <div className="space-y-4">
                        {(() => {
                          const scoreSurface = feedback.reading.productRuntime.experience.score;

                          return (
                            <>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {feedback.reading.productRuntime.visibleSections.includes('bill_value') &&
                            scoreSurface.billValue && (
                            <div className="rounded-[18px] border border-white/10 bg-white/6 px-4 py-4">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9dd8b1]">
                                Valor da conta
                              </p>
                              <p className="score-display mt-2 text-[1.7rem] font-bold text-white">
                                {scoreSurface.billValue}
                              </p>
                            </div>
                          )}
                          {feedback.reading.productRuntime.visibleSections.includes('consumption') &&
                            scoreSurface.consumption && (
                            <div className="rounded-[18px] border border-white/10 bg-white/6 px-4 py-4">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9dd8b1]">
                                Consumo
                              </p>
                              <p className="score-display mt-2 text-[1.7rem] font-bold text-white">
                                {scoreSurface.consumption}
                              </p>
                            </div>
                          )}
                        </div>

                        {feedback.reading.productRuntime.visibleSections.includes('primary_action') &&
                          scoreSurface.action?.label && (
                          <div className="rounded-[18px] border border-white/10 bg-white/6 px-4 py-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9dd8b1]">
                              O que fazer agora
                            </p>
                            <p className="mt-2 text-sm leading-6 text-white sm:text-[15px] sm:leading-7">
                              {scoreSurface.action.label}
                            </p>
                          </div>
                        )}

                        {feedback.reading.productRuntime.visibleSections.includes('secondary_signals') &&
                          scoreSurface.secondarySignals.length > 0 && (
                          <div className="rounded-[20px] border border-white/10 bg-white/6 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9dd8b1]">
                              {scoreSurface.discovery?.id
                                ? 'Outros sinais desta conta'
                                : 'O que mais parece pesar'}
                            </p>
                            <div className="mt-3 grid gap-2.5">
                              {scoreSurface.secondarySignals.map((impact) => (
                                <div
                                  key={impact.id}
                                  className={`flex items-start justify-between gap-4 rounded-[16px] border px-4 py-3 ${
                                    impact.isResidual
                                      ? 'border-dashed border-white/12 bg-black/10'
                                      : 'border-white/10 bg-black/10'
                                  }`}
                                >
                                  <div>
                                    <p className="font-semibold text-white">{impact.label}</p>
                                    {impact.insight && (
                                      <p className="mt-1 max-w-xl text-sm leading-5 text-white/68">
                                        {impact.insight}
                                      </p>
                                    )}
                                    {impact.costLabel && (
                                      <p className="mt-1 text-sm text-white/62">{impact.costLabel}</p>
                                    )}
                                  </div>
                                  {impact.shareLabel && (
                                    <p className="text-lg font-semibold text-white">{impact.shareLabel}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                    {feedback.evidenceLine && (
                      <p className="text-sm leading-6 text-white/76">{feedback.evidenceLine}</p>
                    )}
                    {feedback.hypothesisLine && !feedback.reading && (
                      <p className="text-white/84">{feedback.hypothesisLine}</p>
                    )}
                    {feedback.uncertaintyLine && (
                      <p className="text-sm leading-6 text-white/62">{feedback.uncertaintyLine}</p>
                    )}
                    {feedback.helperText && !feedback.reading && (
                      <div className="rounded-[18px] border border-white/10 bg-white/6 px-4 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9dd8b1]">
                          Proximo refinamento
                        </p>
                        <p className="mt-2 text-sm leading-6 text-white sm:text-[15px] sm:leading-7">
                          {feedback.helperText}
                        </p>
                      </div>
                    )}
                    {feedback.continueLabel && onFeedbackContinue && (
                      <Button
                        data-cognitive-next-step="continue-investigation"
                        className="rounded-full bg-white text-[#0f4035] hover:bg-[#e8f3eb]"
                        onClick={onFeedbackContinue}
                      >
                        {feedback.continueLabel}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    {runtimeExperience?.house.memory.facts[0]?.statement && !isHero && (
                      <p className="text-white/84">
                        {runtimeExperience.house.memory.facts[0].statement}
                      </p>
                    )}

                    {runtimeExperience?.house.memory.stablePatterns[0]?.label &&
                      !isHero &&
                      !runtimeExperience.house.memory.facts[0]?.statement && (
                        <p className="text-white/84">
                          {runtimeExperience.house.memory.stablePatterns[0].label}
                        </p>
                      )}

                    {!runtimeExperience && viewModel.corePresence.memoryLine && (
                      <p className="text-white/84">
                        {surfaceRuntime?.hermes.memory || viewModel.corePresence.memoryLine}
                      </p>
                    )}

                    {runtimeExperience ? (
                      <>
                        {!isHero && <p className="text-white/84">{runtimeExperience.speech.clueLine}</p>}
                        {runtimeExperience.speech.optionalQuestionLine && !isHero && (
                          <div className="rounded-[20px] border border-white/10 bg-white/6 p-3">
                            <p className="font-semibold text-white">Posso confirmar uma coisa?</p>
                            <p className="mt-2 text-white/74">
                              {runtimeExperience.speech.optionalQuestionLine}
                            </p>
                          </div>
                        )}
                        <p>{runtimeExperience.primaryClue.explanation}</p>
                      </>
                    ) : null}

                    {!runtimeExperience && viewModel.corePresence.detail && (
                      <p className="text-white/84">
                        {surfaceRuntime?.score.support || viewModel.corePresence.detail}
                      </p>
                    )}

                    {question && activeQuestion && !isHero && (
                      <div className="space-y-3 rounded-[20px] border border-white/10 bg-white/6 p-3">
                        <div>
                          <p className="font-semibold text-white">{question.heading || 'Posso confirmar uma coisa?'}</p>
                          <p className="mt-2 text-white/74">{question.prompt}</p>
                        </div>

                        <div className="grid gap-2">
                          {question.options.map((option) => (
                            <Button
                              key={`${activeQuestion.id}-${option.value}`}
                              variant="outline"
                              className="h-auto justify-start rounded-[16px] border-white/12 bg-white/6 px-3 py-3 text-left text-white hover:bg-white/12 hover:text-white"
                              onClick={() => handleAnswer(activeQuestion, option.value)}
                            >
                              <span className="text-sm font-semibold leading-6">{option.label}</span>
                            </Button>
                          ))}
                        </div>

                        {question.kind === 'context' && activeQuestion.kind === 'context' && (
                          <button
                            type="button"
                            className="text-left text-sm text-white/64 underline-offset-4 hover:text-white hover:underline"
                            onClick={() => onContextQuestionIgnore(activeQuestion)}
                          >
                            Agora nao
                          </button>
                        )}
                      </div>
                    )}

                    {!runtimeExperience && !question && (
                      <p>{viewModel.corePresence.idleLine}</p>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              {isHero && (readingRuntime || runtimeExperience) ? (
                <>
                  {!feedback && !question && runtimePrimaryButton}
                  {question && (
                    <p className="max-w-xl text-sm text-white/58">
                      {question.helperText ||
                        surfaceRuntime?.score.action?.label ||
                        'Responda acima para eu seguir com a proxima leitura.'}
                    </p>
                  )}
                </>
              ) : hasExpandableContent ? (
                <Button
                  className="rounded-full bg-white/10 px-4 text-white hover:bg-white/16"
                  onClick={() => setIsOpen((currentValue) => !currentValue)}
                >
                  {ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <a
                  href="/assistente"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/12"
                >
                  Ver mais com a Score
                  <ArrowRight className="h-4 w-4" />
                </a>
              )}

              {!isHero && (
                <button
                  type="button"
                  className="text-sm text-white/68 underline-offset-4 hover:text-white hover:underline"
                  onClick={() => onOpenDetails(detailSection)}
                >
                  {feedback?.memoryLinkLabel ||
                    activeRuntime?.experience.score.deepReading.label ||
                    runtimeExperience?.speech.evidenceLabel ||
                    'Ver mais sobre esta conta'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default CorePresence;
