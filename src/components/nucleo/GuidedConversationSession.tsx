import React from 'react';
import {
  Loader2,
} from 'lucide-react';
import type { CoreExperience } from '@/lib/cognitive';
import CorePresence, { CorePresenceFeedback } from '@/components/nucleo/CorePresence';
import LivingCore from '@/components/nucleo/LivingCore';
import {
  GuidedConversationActionQuestion,
  buildGuidedAnswerFeedbackSurface,
  GuidedConversationContextQuestion,
  GuidedConversationViewModel,
} from '@/lib/guidedConversation';
import { MascotContextQuestionValue } from '@/types/mvp';

type DetailSectionKey = 'profile' | 'summary' | 'actions' | 'history' | 'memory';

interface GuidedConversationSessionProps {
  experience?: CoreExperience;
  onActionQuestionAnswer: (question: GuidedConversationActionQuestion, value: string) => void;
  onContextQuestionAnswer: (
    question: GuidedConversationContextQuestion,
    value: MascotContextQuestionValue
  ) => void;
  onContextQuestionIgnore: (question: GuidedConversationContextQuestion) => void;
  onOpenDetails: (section: DetailSectionKey) => void;
  profileTask?: React.ReactNode;
  uploadTask?: React.ReactNode;
  viewModel: GuidedConversationViewModel;
}

const buildInitialInvestigationFeedback = ({
  experience,
  viewModel,
}: {
  experience?: CoreExperience;
  viewModel: GuidedConversationViewModel;
}): CorePresenceFeedback => {
  const runtime = viewModel.firstReading?.productRuntime;
  const surface = runtime?.experience;

  return {
    continueLabel:
      runtime?.cta?.target === 'question'
        ? runtime.cta.label
        : undefined,
    evidenceLine:
      surface?.score.deepReading.preview ||
      viewModel.firstReading?.support ||
      experience?.primaryClue.explanation ||
      viewModel.reading.support,
    helperText:
      surface?.score.action?.label ||
      viewModel.firstReading?.primaryDiscovery.action ||
      viewModel.firstReading?.nextRefinement ||
      viewModel.conclusion.nextStepDetail ||
      viewModel.summary.nextDecision,
    message:
      surface?.score.discovery?.headline ||
      viewModel.firstReading?.intro ||
      viewModel.firstReading?.primaryDiscovery.headline ||
      experience?.speech.clueLine ||
      viewModel.reading.support ||
      'Ja consigo afirmar alguma coisa util com honestidade antes de perguntar de novo.',
    reading: viewModel.firstReading,
    supportLine:
      surface?.score.meaning ||
      viewModel.firstReading?.primaryDiscovery.meaning,
    title:
      surface?.hermes.line ||
      viewModel.firstReading?.title ||
      viewModel.firstReading?.primaryDiscovery.headline ||
      'Sua conta deste ciclo',
    uncertaintyLine:
      surface?.score.uncertainty ||
      viewModel.firstReading?.uncertainty ||
      viewModel.reading.caution,
  };
};

const GuidedConversationSession = ({
  experience,
  onActionQuestionAnswer,
  onContextQuestionAnswer,
  onContextQuestionIgnore,
  onOpenDetails,
  profileTask,
  uploadTask,
  viewModel,
}: GuidedConversationSessionProps) => {
  const [feedback, setFeedback] = React.useState<CorePresenceFeedback | null>(null);
  const [revealedQuestionId, setRevealedQuestionId] = React.useState<string | null>(null);
  const runtimeExperience = viewModel.state === 'ready' ? experience : undefined;
  const surfaceRuntime = viewModel.productRuntime.experience;

  React.useEffect(() => {
    setFeedback(null);
    setRevealedQuestionId(null);
  }, [runtimeExperience?.id, viewModel.sessionKey]);

  React.useEffect(() => {
    if (viewModel.state !== 'ready') {
      return;
    }

    if (feedback) {
      return;
    }

    if (viewModel.currentQuestion && revealedQuestionId === viewModel.currentQuestion.id) {
      return;
    }

    setFeedback(
      buildInitialInvestigationFeedback({
        experience: runtimeExperience,
        viewModel,
      })
    );
  }, [
    feedback,
    revealedQuestionId,
    runtimeExperience,
    viewModel,
    viewModel.currentQuestion,
    viewModel.state,
  ]);

  const handleActionQuestionAnswer = React.useCallback(
    (question: GuidedConversationActionQuestion, value: string) => {
      const surface = buildGuidedAnswerFeedbackSurface({
        question,
        value,
      });

      setFeedback({
        continueLabel: surface.continueLabel,
        helperText: surface.productRuntime.experience.score.action?.label,
        message: surface.message,
        productRuntime: surface.productRuntime,
        title: surface.title,
      });
      setRevealedQuestionId(null);
      onActionQuestionAnswer(question, value);
    },
    [onActionQuestionAnswer]
  );

  const handleContextQuestionAnswer = React.useCallback(
    (question: GuidedConversationContextQuestion, value: MascotContextQuestionValue) => {
      const surface = buildGuidedAnswerFeedbackSurface({
        question,
        value,
      });

      setFeedback({
        continueLabel: surface.continueLabel,
        helperText: surface.productRuntime.experience.score.action?.label,
        memoryLinkLabel: 'Ver mais sobre esta conta',
        message: surface.message,
        productRuntime: surface.productRuntime,
        title: surface.title,
      });
      setRevealedQuestionId(null);
      onContextQuestionAnswer(question, value);
    },
    [onContextQuestionAnswer]
  );

  const handleFeedbackContinue = React.useCallback(() => {
    setRevealedQuestionId(viewModel.currentQuestion?.id ?? null);
    setFeedback(null);
  }, [viewModel.currentQuestion?.id]);

  const renderAccountUnderstandingPanel = () => {
    if (viewModel.state !== 'ready') {
      return null;
    }

    return (
      <section
        data-account-understanding-panel="true"
        className="rounded-[24px] border border-white/10 bg-white/4 p-4 text-white backdrop-blur-sm sm:p-5"
      >
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9dd8b1]">
            O que ja sei
          </p>
          <h3 className="score-display max-w-[16ch] text-xl font-bold leading-[1.02] sm:text-2xl">
            {viewModel.accountUnderstanding.title}
          </h3>
          <p className="max-w-2xl text-sm leading-6 text-white/68">
            {viewModel.accountUnderstanding.intro}
          </p>
        </div>

        <div className="mt-4 flex gap-3 overflow-x-auto pb-1 score-scrollbar-none">
          {viewModel.accountUnderstanding.categories.map((category) => (
            <article
              key={category.id}
              data-understanding-category={category.id}
              data-understanding-level={category.level}
              data-understanding-open={category.isOpenQuestion ? 'true' : 'false'}
              data-understanding-open-point={category.openPoint ?? ''}
              data-understanding-support-count={category.supportCount}
              className="min-w-[220px] max-w-[220px] shrink-0 rounded-[18px] border border-white/10 bg-black/10 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{category.label}</p>
                </div>
                <span className="rounded-full border border-white/12 bg-white/8 px-2 py-1 text-[11px] text-white/72">
                  {category.supportCount} referencia{category.supportCount === 1 ? '' : 's'}
                </span>
              </div>

              <p className="mt-3 text-sm leading-5 text-white/78">{category.reason}</p>

              <p className="mt-3 text-xs leading-5 text-white/58">
                {category.openPoint
                  ? `Ainda falta entender: ${category.openPoint}`
                  : 'Nada importante ficou pendente aqui por enquanto.'}
              </p>
            </article>
          ))}
        </div>
      </section>
    );
  };


  if (viewModel.state === 'loading') {
    return (
      <section className="score-stage relative overflow-hidden rounded-[34px] px-6 py-10 text-white">
        <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,rgba(43,194,116,0.16),transparent_60%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
          <div className="space-y-5">
            <p className="score-caption text-[#7fe3ae]">{viewModel.opening.eyebrow}</p>
            <h1 className="score-display max-w-[12ch] text-4xl font-bold leading-[0.96] sm:text-5xl">
              {surfaceRuntime.score.discovery?.headline || viewModel.opening.title}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-white/72">
              {surfaceRuntime.score.support || viewModel.opening.body}
            </p>
            <div className="flex items-center gap-3 text-white/66">
              <Loader2 className="h-5 w-5 animate-spin text-[#7fe3ae]" />
              <span className="text-sm">{surfaceRuntime.hermes.line || 'Continuando de onde paramos.'}</span>
            </div>
          </div>

          <div className="flex items-center justify-center lg:justify-end">
            <LivingCore
              level={viewModel.scoreSummary.level}
              points={viewModel.scoreSummary.points}
              size={184}
            />
          </div>
        </div>
      </section>
    );
  }

  if (viewModel.state === 'profile') {
    return (
      <section className="score-stage relative overflow-hidden rounded-[34px] px-6 py-8 text-white sm:px-8 sm:py-10">
        <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,rgba(43,194,116,0.16),transparent_60%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <div className="space-y-4">
              <span className="score-pill border-white/12 bg-white/8 text-white/82">
                Base da jornada
              </span>
              <h1 className="score-display max-w-[12ch] text-4xl font-bold leading-[0.96] sm:text-5xl">
                {surfaceRuntime.score.discovery?.headline || viewModel.opening.title}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/72">
                {surfaceRuntime.score.support || viewModel.opening.body}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
              <div className="flex justify-center md:justify-start">
                <LivingCore
                  level={viewModel.scoreSummary.level}
                  points={viewModel.scoreSummary.points}
                  size={148}
                />
              </div>
              <div>{profileTask}</div>
            </div>
          </div>

          <CorePresence
            experience={runtimeExperience}
            feedback={feedback}
            onActionQuestionAnswer={handleActionQuestionAnswer}
            onContextQuestionAnswer={handleContextQuestionAnswer}
            onContextQuestionIgnore={onContextQuestionIgnore}
            onFeedbackContinue={handleFeedbackContinue}
            onOpenDetails={onOpenDetails}
            viewModel={viewModel}
          />
        </div>
      </section>
    );
  }

  if (viewModel.state === 'upload') {
    return (
      <section className="score-stage relative overflow-hidden rounded-[34px] px-6 py-8 text-white sm:px-8 sm:py-10">
        <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,rgba(43,194,116,0.16),transparent_60%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <div className="space-y-4">
              <span className="score-pill score-pill-green">Primeira conta</span>
              <h1 className="score-display max-w-[12ch] text-4xl font-bold leading-[0.96] sm:text-5xl">
                {surfaceRuntime.score.discovery?.headline || viewModel.opening.title}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/72">
                {surfaceRuntime.score.support || viewModel.opening.body}
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-start">
              <div className="flex justify-center lg:justify-start">
                <LivingCore
                  level={viewModel.scoreSummary.level}
                  points={viewModel.scoreSummary.points}
                  size={148}
                />
              </div>
              <div>{uploadTask}</div>
            </div>
          </div>

          <CorePresence
            experience={runtimeExperience}
            feedback={feedback}
            onActionQuestionAnswer={handleActionQuestionAnswer}
            onContextQuestionAnswer={handleContextQuestionAnswer}
            onContextQuestionIgnore={onContextQuestionIgnore}
            onFeedbackContinue={handleFeedbackContinue}
            onOpenDetails={onOpenDetails}
            viewModel={viewModel}
          />
        </div>
      </section>
    );
  }

  if (viewModel.state === 'processing') {
    return (
      <section className="score-stage relative overflow-hidden rounded-[34px] px-6 py-10 text-white">
        <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,rgba(43,194,116,0.16),transparent_60%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
          <div className="space-y-6">
            <span className="score-pill score-pill-green">Leitura em andamento</span>
            <h1 className="score-display max-w-[12ch] text-4xl font-bold leading-[0.96] sm:text-5xl">
              {surfaceRuntime.score.discovery?.headline || viewModel.opening.title}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-white/72">
              {surfaceRuntime.score.support || viewModel.opening.body}
            </p>

            <div className="flex items-center gap-4">
              <LivingCore
                level={viewModel.scoreSummary.level}
                points={viewModel.scoreSummary.points}
                size={132}
              />
              <div className="flex items-center gap-3 text-white/68">
                <Loader2 className="h-5 w-5 animate-spin text-[#7fe3ae]" />
                <span className="text-sm">
                  {surfaceRuntime.hermes.line || 'Estou olhando sua conta agora.'}
                </span>
              </div>
            </div>
          </div>

          <CorePresence
            experience={runtimeExperience}
            feedback={feedback}
            onActionQuestionAnswer={handleActionQuestionAnswer}
            onContextQuestionAnswer={handleContextQuestionAnswer}
            onContextQuestionIgnore={onContextQuestionIgnore}
            onFeedbackContinue={handleFeedbackContinue}
            onOpenDetails={onOpenDetails}
            viewModel={viewModel}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="score-stage relative overflow-hidden rounded-[30px] px-4 py-5 text-white sm:px-6 sm:py-7">
      <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,rgba(43,194,116,0.16),transparent_60%)]" />
      <div className="absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(43,194,116,0.18),transparent_72%)] blur-3xl" />

      <div className="relative mx-auto max-w-3xl space-y-5">
        <div className="flex flex-wrap items-center gap-3 text-xs text-white/66">
          <span className="score-pill border-white/12 bg-white/8 text-white/82">
            {`Conta em foco: ${viewModel.summary.cycleLabel}`}
          </span>
        </div>

        <CorePresence
          experience={runtimeExperience}
          feedback={feedback}
          onActionQuestionAnswer={handleActionQuestionAnswer}
          onContextQuestionAnswer={handleContextQuestionAnswer}
          onContextQuestionIgnore={onContextQuestionIgnore}
          onFeedbackContinue={handleFeedbackContinue}
          onOpenDetails={onOpenDetails}
          variant="hero"
          viewModel={viewModel}
        />

        <div className="hidden" aria-hidden="true">
          {renderAccountUnderstandingPanel()}
        </div>
      </div>
    </section>
  );
};

export default GuidedConversationSession;
