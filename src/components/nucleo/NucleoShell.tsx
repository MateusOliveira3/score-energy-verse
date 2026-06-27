import { ArrowRight, Check, Compass, Cpu, Link2, Loader2, ScanSearch } from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import InvoiceUpload from '@/components/InvoiceUpload';
import LivingCore from '@/components/nucleo/LivingCore';
import { cn } from '@/lib/utils';
import { NucleoBeatId, NucleoSessionViewModel } from '@/lib/nucleoSession';
import {
  InvoiceData,
  NextAction,
  NextActionStatus,
  UserProfileData,
} from '@/types/mvp';

type DetailSectionKey = 'profile' | 'summary' | 'actions' | 'history' | 'memory';

interface NucleoShellProps {
  profile: UserProfileData;
  primaryAction?: NextAction;
  viewModel: NucleoSessionViewModel;
  onOpenDetail: (section: DetailSectionKey) => void;
  onUploadStarted: () => void;
  onInvoiceProcessed: (file: File) => Promise<InvoiceData | void>;
  onUploadCompleted: (invoice?: InvoiceData) => void;
  onActionStatusChange: (
    action: NextAction,
    status: Extract<NextActionStatus, 'in_progress' | 'completed'>
  ) => void;
}

const beatIcons = {
  observa: ScanSearch,
  relaciona: Link2,
  memoriza: Cpu,
  orienta: Compass,
} as const;

const NucleoShell = ({
  profile,
  primaryAction,
  viewModel,
  onOpenDetail,
  onUploadStarted,
  onInvoiceProcessed,
  onUploadCompleted,
  onActionStatusChange,
}: NucleoShellProps) => {
  const [showIntro, setShowIntro] = React.useState(true);
  const [activeBeatId, setActiveBeatId] = React.useState<NucleoBeatId>(viewModel.activeBeatId);

  React.useEffect(() => {
    setActiveBeatId(viewModel.activeBeatId);
  }, [viewModel.activeBeatId]);

  React.useEffect(() => {
    if (viewModel.visualState !== 'guided') {
      setShowIntro(false);
      return;
    }

    setShowIntro(true);
  }, [viewModel.visualState, viewModel.observe.invoiceLabel]);

  const currentBeatIndex = viewModel.beats.findIndex((beat) => beat.id === activeBeatId);
  const currentBeat = viewModel.beats[currentBeatIndex] ?? viewModel.beats[0];

  const renderBeatContent = () => {
    if (activeBeatId === 'observa') {
      return (
        <div className="space-y-4">
          <div>
            <p className="score-caption">Passo 1 de 4</p>
            <h2 className="score-display mt-2 text-3xl font-bold text-white">
              {viewModel.observe.title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72">
              A Score transforma a fatura em leitura estruturada sem pedir digitacao manual.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {viewModel.observe.facts.map((fact) => (
              <div
                key={fact.label}
                className="rounded-[20px] border border-white/10 bg-white/6 px-4 py-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                  {fact.label}
                </p>
                <p className="mt-2 text-xl font-semibold text-white">{fact.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
              Sinais extraidos
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {viewModel.observe.extractedSignals.map((signal) => (
                <span
                  key={signal}
                  className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-xs font-medium text-white/82"
                >
                  {signal}
                </span>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeBeatId === 'relaciona') {
      return (
        <div className="space-y-4">
          <div>
            <p className="score-caption">Passo 2 de 4</p>
            <h2 className="score-display mt-2 text-3xl font-bold text-white">
              {viewModel.relate.title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72">
              O Nucleo cruza leitura atual, historico e score para mostrar o que realmente mudou.
            </p>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-white/6 px-5 py-5">
            <p className="text-lg font-semibold text-white">{viewModel.relate.summary}</p>
            <p className="mt-2 text-sm leading-6 text-white/72">{viewModel.relate.support}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {viewModel.relate.chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-xs font-medium text-white/82"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      );
    }

    if (activeBeatId === 'memoriza') {
      return (
        <div className="space-y-4">
          <div>
            <p className="score-caption">Passo 3 de 4</p>
            <h2 className="score-display mt-2 text-3xl font-bold text-white">
              {viewModel.memorize.title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72">
              Memoria Energetica guarda o que aprendemos sobre voce. Conhecimento Energetico
              registra o que voce ja absorveu da Score.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[22px] border border-white/10 bg-white/6 px-5 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                Memoria Energetica
              </p>
              <p className="mt-2 text-sm leading-6 text-white/80">{viewModel.memorize.summary}</p>
              <div className="mt-4 space-y-2">
                {viewModel.memorize.confirmedSignals.map((signal) => (
                  <div
                    key={signal}
                    className="rounded-[16px] border border-white/10 bg-black/10 px-3 py-2 text-sm text-white/82"
                  >
                    {signal}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white/6 px-5 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                Conhecimento Energetico
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {viewModel.memorize.learnedCount} / {viewModel.memorize.totalKnowledge}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/72">
                Conhecimentos adquiridos e prontos para reaparecer como contexto, nao como ruido.
              </p>
              {viewModel.memorize.latestKnowledge && (
                <p className="mt-4 text-sm text-white/84">
                  Ultimo aprendizado: <span className="font-semibold">{viewModel.memorize.latestKnowledge}</span>
                </p>
              )}
              {viewModel.memorize.nextKnowledge && (
                <p className="mt-2 text-sm text-white/72">
                  Proximo conhecimento: <span className="font-semibold text-white">{viewModel.memorize.nextKnowledge}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div>
          <p className="score-caption">Passo 4 de 4</p>
          <h2 className="score-display mt-2 text-3xl font-bold text-white">
            {viewModel.orient.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72">
            Aqui o Nucleo deixa de ser leitura e vira proximo passo claro, sem trocar a regra de recomendacao.
          </p>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/6 px-5 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-none bg-[#2bc274] text-[#08301f] hover:bg-[#2bc274]">
              {viewModel.orient.statusLabel}
            </Badge>
            {viewModel.orient.actionValue && (
              <Badge variant="outline" className="border-white/12 bg-white/8 text-white">
                {viewModel.orient.actionValue}
              </Badge>
            )}
          </div>
          <h3 className="mt-4 text-2xl font-semibold text-white">
            {viewModel.orient.actionTitle || 'Sem acao principal definida'}
          </h3>
          <p className="mt-3 text-sm leading-6 text-white/78">{viewModel.orient.summary}</p>

          {viewModel.orient.evidence.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {viewModel.orient.evidence.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/12 bg-black/12 px-3 py-1 text-xs font-medium text-white/78"
                >
                  {item}
                </span>
              ))}
            </div>
          )}

          {viewModel.orient.followUp && (
            <p className="mt-4 rounded-[18px] border border-white/10 bg-black/10 px-4 py-3 text-sm leading-6 text-white/74">
              Proximo ciclo: {viewModel.orient.followUp}
            </p>
          )}

          {primaryAction && (
            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                className="rounded-[14px] bg-[#2bc274] text-[#08301f] hover:bg-[#26ae67]"
                onClick={() => onActionStatusChange(primaryAction, 'in_progress')}
              >
                Marcar em andamento
              </Button>
              <Button
                variant="outline"
                className="rounded-[14px] border-white/15 bg-white/6 text-white hover:bg-white/12"
                onClick={() => onActionStatusChange(primaryAction, 'completed')}
              >
                Registrar como testada
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (viewModel.visualState === 'loading') {
    return (
      <section className="score-stage overflow-hidden rounded-[30px] px-6 py-10 text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
          <LivingCore level={viewModel.scoreSummary.level} points={viewModel.scoreSummary.points} />
          <div>
            <p className="score-caption text-[#7fe3ae]">Nucleo</p>
            <h1 className="score-display mt-2 text-4xl font-bold">Carregando sua jornada atual</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/72">
              Estamos recuperando memoria, leitura e proximos passos do estado persistido.
            </p>
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-[#7fe3ae]" />
        </div>
      </section>
    );
  }

  if (viewModel.visualState === 'profile') {
    return (
      <section className="score-stage overflow-hidden rounded-[30px] px-6 py-10 text-white">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="flex justify-center">
            <LivingCore level={viewModel.scoreSummary.level} points={viewModel.scoreSummary.points} />
          </div>
          <div className="space-y-5">
            <span className="score-pill score-pill-green">Preparar o Nucleo</span>
            <h1 className="score-display text-4xl font-bold">
              Falta o contexto minimo para tornar a memoria confiavel
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-white/72">
              Antes da primeira conta, a Score precisa do seu perfil basico para personalizar a
              leitura sem inventar comportamento.
            </p>
            <Button
              className="rounded-[15px] bg-[#2bc274] text-[#08301f] hover:bg-[#26ae67]"
              onClick={() => onOpenDetail('profile')}
            >
              Abrir configuracao do perfil
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (viewModel.visualState === 'processing') {
    return (
      <section className="score-stage overflow-hidden rounded-[30px] px-6 py-10 text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
          <LivingCore level={viewModel.scoreSummary.level} points={viewModel.scoreSummary.points} />
          <span className="score-pill score-pill-green">Processando a nova fatura</span>
          <div>
            <h1 className="score-display text-4xl font-bold">Seu Nucleo esta lendo o novo ciclo</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/72">
              O processamento continua usando o fluxo atual de parser e analise. Esta tela so
              organiza a experiencia de entrada do ciclo.
            </p>
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-[#7fe3ae]" />
        </div>
      </section>
    );
  }

  if (viewModel.visualState === 'upload') {
    return (
      <section className="score-stage overflow-hidden rounded-[30px] px-6 py-10 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-5">
            <span className="score-pill score-pill-green">Primeira conta</span>
            <h1 className="score-display text-4xl font-bold">{viewModel.cycleSummary.headline}</h1>
            <p className="max-w-2xl text-sm leading-6 text-white/72">
              {viewModel.cycleSummary.support}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="score-pill border-white/12 bg-white/6 text-white/82">
                Score acompanha sua evolucao
              </span>
              <span className="score-pill border-white/12 bg-white/6 text-white/82">
                Memoria aprende com dados reais
              </span>
              <span className="score-pill border-white/12 bg-white/6 text-white/82">
                Recomendacoes mantem a logica atual
              </span>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/6 p-4">
            <InvoiceUpload
              profile={profile}
              variant="embedded"
              onUploadStarted={onUploadStarted}
              onInvoiceProcessed={onInvoiceProcessed}
              onUploadCompleted={onUploadCompleted}
            />
          </div>
        </div>
      </section>
    );
  }

  if (viewModel.visualState === 'complete') {
    return (
      <section className="score-stage overflow-hidden rounded-[30px] px-6 py-10 text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
          <LivingCore level={viewModel.scoreSummary.level} points={viewModel.scoreSummary.points} />
          <span className="score-pill score-pill-green">Ciclo incorporado</span>
          <div>
            <h1 className="score-display text-4xl font-bold">Sua energia ficou mais inteligente hoje</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/72">
              A acao principal deste ciclo ja foi registrada. No proximo mes, o Nucleo retoma daqui
              sem trocar score, memoria ou recomendacao por regras novas.
            </p>
          </div>

          <div className="grid w-full gap-3 md:grid-cols-3">
            <div className="rounded-[20px] border border-white/10 bg-white/6 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                Score atual
              </p>
              <p className="score-display mt-2 text-3xl font-bold text-white">
                {viewModel.scoreSummary.points}
              </p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/6 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                Historico ativo
              </p>
              <p className="score-display mt-2 text-3xl font-bold text-white">
                {viewModel.cycleSummary.invoices}
              </p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/6 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                Conhecimentos
              </p>
              <p className="score-display mt-2 text-3xl font-bold text-white">
                {viewModel.memorize.learnedCount}/{viewModel.memorize.totalKnowledge}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button
              className="rounded-[15px] bg-[#2bc274] text-[#08301f] hover:bg-[#26ae67]"
              onClick={() => onOpenDetail('actions')}
            >
              Revisar a acao
            </Button>
            <Button
              variant="outline"
              className="rounded-[15px] border-white/15 bg-white/6 text-white hover:bg-white/12"
              onClick={() => onOpenDetail('memory')}
            >
              Ver memoria completa
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="score-stage overflow-hidden rounded-[30px] px-6 py-8 text-white">
      {showIntro ? (
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 py-6 text-center">
          <LivingCore level={viewModel.scoreSummary.level} points={viewModel.scoreSummary.points} size={228} />
          <span className="score-pill score-pill-green">
            Ciclo atual: {viewModel.observe.invoiceLabel}
          </span>
          <div>
            <h1 className="score-display text-4xl font-bold">{viewModel.welcomeTitle}</h1>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-white/72">
              {viewModel.welcomeMessage}
            </p>
          </div>
          <div className="grid w-full gap-3 md:grid-cols-3">
            <div className="rounded-[20px] border border-white/10 bg-white/6 px-4 py-4 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                Score
              </p>
              <p className="score-display mt-2 text-3xl font-bold text-white">
                {viewModel.scoreSummary.points}
              </p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/6 px-4 py-4 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                Historico
              </p>
              <p className="score-display mt-2 text-3xl font-bold text-white">
                {viewModel.cycleSummary.invoices}
              </p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/6 px-4 py-4 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                Conhecimento
              </p>
              <p className="score-display mt-2 text-3xl font-bold text-white">
                {viewModel.memorize.learnedCount}/{viewModel.memorize.totalKnowledge}
              </p>
            </div>
          </div>
          <Button
            className="rounded-[15px] bg-[#2bc274] px-6 text-[#08301f] hover:bg-[#26ae67]"
            onClick={() => setShowIntro(false)}
          >
            Comecar a leitura de hoje
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="mx-auto grid max-w-6xl gap-7 lg:grid-cols-[260px_1fr]">
          <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="flex justify-center">
              <LivingCore level={viewModel.scoreSummary.level} points={viewModel.scoreSummary.points} size={152} />
            </div>

            <div className="space-y-2">
              {viewModel.beats.map((beat, index) => {
                const Icon = beatIcons[beat.id];
                const isActive = beat.id === currentBeat.id;
                const isDone = index < currentBeatIndex;

                return (
                  <button
                    key={beat.id}
                    type="button"
                    onClick={() => setActiveBeatId(beat.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-[18px] border px-4 py-3 text-left transition',
                      isActive
                        ? 'border-white/18 bg-white text-[#14201a] shadow-[0_18px_40px_-28px_rgba(0,0,0,0.4)]'
                        : 'border-transparent bg-transparent text-white/64 hover:border-white/10 hover:bg-white/6 hover:text-white'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-full',
                        isActive
                          ? 'bg-[#e7f5ed] text-[#0b6038]'
                          : isDone
                            ? 'bg-[#2bc274] text-[#08301f]'
                            : 'bg-white/10 text-white/68'
                      )}
                    >
                      {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </span>
                    <div>
                      <p className={cn('text-sm font-semibold', isActive ? 'text-[#14201a]' : 'text-inherit')}>
                        {beat.title}
                      </p>
                      <p
                        className={cn(
                          'text-[11px] uppercase tracking-[0.14em]',
                          isActive ? 'text-[#557061]' : 'text-white/45'
                        )}
                      >
                        {beat.tag}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-5">
            {renderBeatContent()}

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="rounded-[15px] border-white/15 bg-white/6 text-white hover:bg-white/12"
                onClick={() => onOpenDetail(currentBeat.id === 'memoriza' ? 'memory' : currentBeat.id === 'orienta' ? 'actions' : 'summary')}
              >
                Abrir detalhe desta etapa
              </Button>

              {currentBeatIndex < viewModel.beats.length - 1 ? (
                <Button
                  className="rounded-[15px] bg-[#2bc274] text-[#08301f] hover:bg-[#26ae67]"
                  onClick={() => setActiveBeatId(viewModel.beats[currentBeatIndex + 1].id)}
                >
                  Continuar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  className="rounded-[15px] bg-[#2bc274] text-[#08301f] hover:bg-[#26ae67]"
                  onClick={() => onOpenDetail('actions')}
                >
                  Fechar com a acao principal
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default NucleoShell;
