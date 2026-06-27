import React from 'react';
import { Bot, Loader2, Send, Sparkles, Zap } from 'lucide-react';
import LivingCore from '@/components/nucleo/LivingCore';
import { useAuth } from '@/contexts/AuthContext';
import { useMvpJourney } from '@/hooks/useMvpJourney';
import { buildScoreAssistantContext } from '@/lib/scoreAssistant/buildScoreAssistantContext';
import { chatWithScoreAssistant, getScoreAssistantStatus } from '@/lib/scoreAssistant/client';
import type {
  ScoreAssistantMessage,
  ScoreAssistantStatusResponse,
} from '@/lib/scoreAssistant/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ConversationMessage extends ScoreAssistantMessage {
  memorySignalsUsed?: string[];
  suggestedNextAction?: string;
}

const QUICK_ACTIONS = [
  'Por que minha conta pode ter aumentado?',
  'O que pesa mais na minha energia?',
  'Explique minha Memoria Energetica',
  'Como posso tomar decisoes melhores este mes?',
] as const;

const AssistantPage = () => {
  const { user } = useAuth();
  const { journeyState, isJourneyHydrated } = useMvpJourney();
  const [draft, setDraft] = React.useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = React.useState<string | undefined>(undefined);
  const [messages, setMessages] = React.useState<ConversationMessage[]>([
    {
      role: 'assistant',
      content:
        'Eu sou o Assistente Score. Meu papel e te ajudar a entender sua energia com base na sua Memoria Energetica, sem inventar dados e sem pular direto para recomendacoes genericas.',
    },
  ]);
  const [status, setStatus] = React.useState<ScoreAssistantStatusResponse | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = React.useState(true);
  const [isSending, setIsSending] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const invoiceHistory = journeyState.analysis.invoiceHistory;
  const responsePersonalizationLabel = status?.hasMemoryContext
    ? 'Resposta mais contextual'
    : 'Resposta mais introdutoria';

  React.useEffect(() => {
    if (!selectedInvoiceId && invoiceHistory[0]?.fingerprint) {
      setSelectedInvoiceId(invoiceHistory[0].fingerprint);
    }
  }, [invoiceHistory, selectedInvoiceId]);

  const assistantContext = React.useMemo(
    () =>
      buildScoreAssistantContext({
        activeView: 'assistente',
        selectedInvoiceId,
        state: journeyState,
      }),
    [journeyState, selectedInvoiceId]
  );

  React.useEffect(() => {
    let isActive = true;

    setIsLoadingStatus(true);
    void getScoreAssistantStatus({
      hasMemoryContext: assistantContext.hasMemoryContext,
      user,
    })
      .then((response) => {
        if (isActive) {
          setStatus(response);
          setErrorMessage(null);
        }
      })
      .catch(() => {
        if (isActive) {
          setErrorMessage('Nao foi possivel verificar o status do assistente agora.');
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingStatus(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [assistantContext.hasMemoryContext, user]);

  React.useEffect(() => {
    viewportRef.current?.scrollTo({
      top: viewportRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  const sendMessage = React.useCallback(
    async (content: string) => {
      const trimmedContent = content.trim();

      if (!trimmedContent || !user || isSending) {
        return;
      }

      const nextUserMessage: ConversationMessage = {
        role: 'user',
        content: trimmedContent,
      };
      const requestMessages = [...messages, nextUserMessage].map<ScoreAssistantMessage>((message) => ({
        role: message.role,
        content: message.content,
      }));

      setMessages((currentMessages) => [...currentMessages, nextUserMessage]);
      setDraft('');
      setErrorMessage(null);
      setIsSending(true);

      try {
        const response = await chatWithScoreAssistant({
          hasMemoryContext: assistantContext.hasMemoryContext,
          request: {
            messages: requestMessages,
            context: {
              activeView: 'assistente',
              selectedInvoiceId,
              scoreContext: assistantContext,
            },
          },
          user,
        });

        setMessages((currentMessages) => [
          ...currentMessages,
          {
            role: 'assistant',
            content: response.answer,
            memorySignalsUsed: response.memorySignalsUsed,
            suggestedNextAction: response.suggestedNextAction,
          },
        ]);
      } catch (_error) {
        setErrorMessage('Nao foi possivel conversar com a Score agora. Tente novamente em instantes.');
      } finally {
        setIsSending(false);
      }
    },
    [assistantContext, isSending, messages, selectedInvoiceId, user]
  );

  return (
    <main className="score-shell min-h-screen px-4 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <Card className="score-card-dark order-2 overflow-hidden rounded-[30px] xl:order-1">
            <CardHeader className="space-y-5 border-b border-white/10 px-6 py-6">
              <div className="score-pill score-pill-green w-fit">
                <Sparkles className="h-3.5 w-3.5" />
                Assistente contextual
              </div>
              <div className="flex justify-center">
                <LivingCore level={journeyState.scoreEvents.length > 0 ? 4 : 1} points={assistantContext.memorySignals.length > 0 ? 770 : 120} size={182} />
              </div>
              <div className="space-y-2 text-center">
                <p className="score-caption text-[#7fe3ae]">Assistente Score</p>
                <CardTitle className="score-display text-4xl text-white">
                  Contexto real antes de resposta.
                </CardTitle>
                <p className="mx-auto max-w-md text-sm leading-6 text-white/72">
                  O assistente usa memoria energetica, leitura atual e proximo passo da jornada.
                  Quando ainda falta contexto, a Score responde com mais prudencia e mostra o que
                  ainda precisa entender melhor.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 px-6 py-6 text-sm text-white/78">
              <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                  Memoria disponivel
                </p>
                <p className="mt-2 leading-6">
                  {assistantContext.memorySignals.length > 0
                    ? assistantContext.memorySignals.join(', ')
                    : 'Ainda sem sinais fortes suficientes para memoria detalhada.'}
                </p>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                  Proximo passo sugerido
                </p>
                <p className="mt-2 leading-6">
                  {assistantContext.suggestedNextAction || 'Sem proximo passo definido ainda.'}
                </p>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                  Hipoteses de carga
                </p>
                <p className="mt-2 leading-6">
                  {assistantContext.loadHypotheses.length > 0
                    ? assistantContext.loadHypotheses.join(', ')
                    : 'Ainda sem hipoteses fortes de carga.'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="score-card order-1 rounded-[30px] xl:order-2">
            <CardHeader className="space-y-3 border-b border-[var(--score-line)] bg-[var(--score-surface-soft)]">
              <div className="score-pill score-pill-green w-fit">
                <Sparkles className="h-3.5 w-3.5" />
                Jornada guiada
              </div>
              <div className="space-y-2">
                <CardTitle className="score-display text-3xl text-[var(--score-ink)]">Assistente Score</CardTitle>
                <p className="max-w-3xl text-sm leading-6 text-[var(--score-ink-soft)]">
                  Entenda sua energia com base na sua memoria energetica. A proposta aqui continua a
                  mesma: responder com contexto da jornada, nao com improviso.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap gap-2">
                {QUICK_ACTIONS.map((question) => (
                  <Button
                    key={question}
                    type="button"
                    variant="outline"
                    disabled={isSending}
                    className="rounded-full border-[var(--score-line)] bg-white text-[var(--score-ink-soft)] hover:bg-[var(--score-surface-soft)]"
                    onClick={() => void sendMessage(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>

              <div
                ref={viewportRef}
                className="flex min-h-[420px] flex-col gap-3 overflow-y-auto rounded-[24px] border border-[var(--score-line)] bg-[var(--score-surface-soft)] p-4"
              >
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={cn(
                      'max-w-[86%] rounded-[20px] px-4 py-3 text-sm leading-6 shadow-sm',
                      message.role === 'assistant'
                        ? 'border border-[var(--score-line)] bg-white text-[var(--score-ink)]'
                        : 'ml-auto bg-[var(--score-green)] text-white'
                    )}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] opacity-80">
                      {message.role === 'assistant' ? (
                        <>
                          <Bot className="h-3.5 w-3.5" />
                          Score
                        </>
                      ) : (
                        'Voce'
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap">{message.content}</p>
                    {message.role === 'assistant' &&
                      (message.memorySignalsUsed?.length || message.suggestedNextAction) && (
                        <div className="mt-3 rounded-[16px] border border-[#e4f1e7] bg-[#f5faf6] px-3 py-3 text-xs leading-5 text-[#4f6f5d]">
                          {message.memorySignalsUsed && message.memorySignalsUsed.length > 0 && (
                            <p>Contexto considerado: {message.memorySignalsUsed.join(', ')}.</p>
                          )}
                          {message.suggestedNextAction && (
                            <p className="mt-1">
                              Proximo passo sugerido: {message.suggestedNextAction}.
                            </p>
                          )}
                        </div>
                      )}
                  </div>
                ))}

                {isSending && (
                  <div className="max-w-[86%] rounded-[20px] border border-[var(--score-line)] bg-white px-4 py-3 text-sm text-[var(--score-ink)] shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] opacity-80">
                      <Bot className="h-3.5 w-3.5" />
                      Score
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Pensando com base no contexto da sua jornada...
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Pergunte algo sobre sua conta, sua memoria energetica ou a melhor decisao para este mes."
                  className="min-h-[120px] border-[var(--score-line)] bg-white text-[var(--score-ink)]"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-[var(--score-ink-faint)]">
                    A Score responde com base na sua jornada atual e fica mais precisa conforme sua
                    memoria energetica evolui.
                  </p>
                  <Button
                    type="button"
                    disabled={!draft.trim() || isSending || !user}
                    className="rounded-[14px] bg-[var(--score-green)] text-white hover:bg-[var(--score-green-deep)]"
                    onClick={() => void sendMessage(draft)}
                  >
                    <Send className="h-4 w-4" />
                    Enviar
                  </Button>
                </div>
                {errorMessage && <p className="text-sm text-rose-600">{errorMessage}</p>}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="score-card rounded-[28px]">
              <CardHeader className="border-b border-[var(--score-line)]">
                <CardTitle className="text-lg text-[var(--score-ink)]">Como a Score esta respondendo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-5 text-sm text-[var(--score-ink-soft)]">
                {isLoadingStatus ? (
                  <div className="flex items-center gap-2 text-[#5f7a69]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verificando o contexto da jornada...
                  </div>
                ) : (
                  <>
                    <div className="rounded-[18px] border border-[var(--score-line)] bg-[var(--score-surface-soft)] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--score-ink-faint)]">
                        Personalizacao atual
                      </p>
                      <p className="mt-2 text-xl font-semibold text-[var(--score-ink)]">
                        {responsePersonalizationLabel}
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-[var(--score-line)] bg-[var(--score-surface-soft)] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--score-ink-faint)]">
                        Sessao autenticada
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--score-ink)]">
                        {status?.userName || user?.email || 'Sessao ativa'}
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-[var(--score-line)] bg-[var(--score-surface-soft)] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--score-ink-faint)]">
                        Memoria disponivel
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--score-ink)]">
                        {status?.hasMemoryContext
                          ? 'Sim. A Score consegue responder usando sinais da sua jornada.'
                          : 'Ainda limitada. A resposta sera mais generica ate a jornada ganhar contexto.'}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="score-card rounded-[28px]">
              <CardHeader className="border-b border-[var(--score-line)]">
                <CardTitle className="flex items-center gap-2 text-lg text-[var(--score-ink)]">
                  <Zap className="h-4 w-4 text-[var(--score-green-deep)]" />
                  Contexto que a Score pode usar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-5 text-sm text-[var(--score-ink-soft)]">
                <div className="rounded-[18px] border border-[var(--score-line)] bg-[var(--score-surface-soft)] p-4">
                  <p className="font-medium text-[var(--score-ink)]">Memoria energetica</p>
                  <p className="mt-2 leading-6">
                    {assistantContext.memorySignals.length > 0
                      ? assistantContext.memorySignals.join(', ')
                      : 'Ainda sem sinais fortes registrados.'}
                  </p>
                </div>

                <div className="rounded-[18px] border border-[var(--score-line)] bg-[var(--score-surface-soft)] p-4">
                  <p className="font-medium text-[var(--score-ink)]">Hipoteses de carga</p>
                  <p className="mt-2 leading-6">
                    {assistantContext.loadHypotheses.length > 0
                      ? assistantContext.loadHypotheses.join(', ')
                      : 'Ainda sem hipoteses fortes de carga.'}
                  </p>
                </div>

                <div className="rounded-[18px] border border-[var(--score-line)] bg-[var(--score-surface-soft)] p-4">
                  <p className="font-medium text-[var(--score-ink)]">Fatura em foco</p>
                  {invoiceHistory.length > 0 ? (
                    <select
                      className="mt-3 w-full rounded-[14px] border border-[var(--score-line)] bg-white px-3 py-2 text-sm text-[var(--score-ink)] outline-none"
                      value={selectedInvoiceId}
                      onChange={(event) => setSelectedInvoiceId(event.target.value)}
                    >
                      {invoiceHistory.map((invoice) => (
                        <option key={invoice.fingerprint} value={invoice.fingerprint}>
                          {invoice.month || invoice.parser.fields.referenceMonth.value || invoice.fileName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="mt-2 leading-6">Nenhuma fatura disponivel ainda.</p>
                  )}
                </div>

                <div className="rounded-[18px] border border-[var(--score-line)] bg-[var(--score-surface-soft)] p-4">
                  <p className="font-medium text-[var(--score-ink)]">Jornada atual</p>
                  <p className="mt-2 leading-6">
                    {isJourneyHydrated
                      ? assistantContext.suggestedNextAction || 'Sem proximo passo definido.'
                      : 'Carregando jornada...'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AssistantPage;
