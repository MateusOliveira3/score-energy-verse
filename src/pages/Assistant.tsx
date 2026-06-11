import React from 'react';
import { Bot, Loader2, Send, Sparkles, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMvpJourney } from '@/hooks/useMvpJourney';
import { buildScoreAssistantContext } from '@/lib/scoreAssistant/buildScoreAssistantContext';
import { chatWithScoreAssistant, getScoreAssistantStatus } from '@/lib/scoreAssistant/client';
import type {
  ScoreAssistantMessage,
  ScoreAssistantMode,
  ScoreAssistantStatusResponse,
} from '@/lib/scoreAssistant/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ConversationMessage extends ScoreAssistantMessage {
  memorySignalsUsed?: string[];
  mode?: ScoreAssistantMode;
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
            mode: response.mode,
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#e7f7ec_0%,#f7fbf8_42%,#ffffff_100%)] px-4 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.7fr)]">
          <Card className="border border-[#d7ebdc] bg-white/95 shadow-[0_20px_60px_rgba(24,78,57,0.08)]">
            <CardHeader className="space-y-3 border-b border-[#e5f1e8] bg-[linear-gradient(135deg,#f4fbf6_0%,#edf8f2_100%)]">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#cfe4d4] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#4f7a5b]">
                <Sparkles className="h-3.5 w-3.5" />
                Nucleo cognitivo inicial
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl text-[#1d3b2a]">Assistente Score</CardTitle>
                <p className="max-w-3xl text-sm leading-6 text-[#567264]">
                  Entenda sua energia com base na sua memoria energetica. O objetivo aqui nao e
                  responder qualquer coisa, e sim transformar sinais da sua jornada em entendimento
                  util para a proxima decisao.
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
                    className="rounded-full border-[#cfe4d4] bg-[#f8fcf9] text-[#28513a] hover:bg-[#eef7f0]"
                    onClick={() => void sendMessage(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>

              <div
                ref={viewportRef}
                className="flex min-h-[420px] flex-col gap-3 overflow-y-auto rounded-[24px] border border-[#e2efe5] bg-[#f9fcfa] p-4"
              >
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={cn(
                      'max-w-[86%] rounded-[20px] px-4 py-3 text-sm leading-6 shadow-sm',
                      message.role === 'assistant'
                        ? 'border border-[#d5eadb] bg-white text-[#214130]'
                        : 'ml-auto bg-[#2d6b48] text-white'
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
                            <p>Base usada: {message.memorySignalsUsed.join(', ')}.</p>
                          )}
                          {message.suggestedNextAction && (
                            <p className="mt-1">
                              Proximo passo sugerido: {message.suggestedNextAction}.
                            </p>
                          )}
                          {message.mode && <p className="mt-1">Modo da resposta: {message.mode}.</p>}
                        </div>
                      )}
                  </div>
                ))}

                {isSending && (
                  <div className="max-w-[86%] rounded-[20px] border border-[#d5eadb] bg-white px-4 py-3 text-sm text-[#214130] shadow-sm">
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
                  className="min-h-[120px] border-[#d5e8da] bg-white text-[#1f3d2c]"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-[#5f7a69]">
                    O assistente responde em modo Hermes quando configurado. Caso contrario, usa
                    fallback educativo local.
                  </p>
                  <Button
                    type="button"
                    disabled={!draft.trim() || isSending || !user}
                    className="rounded-[14px] bg-[#2d6b48] text-white hover:bg-[#255a3c]"
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
            <Card className="border border-[#d7ebdc] bg-white/95">
              <CardHeader className="border-b border-[#e5f1e8]">
                <CardTitle className="text-lg text-[#1d3b2a]">Status do assistente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-5 text-sm text-[#476050]">
                {isLoadingStatus ? (
                  <div className="flex items-center gap-2 text-[#5f7a69]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verificando configuracao...
                  </div>
                ) : (
                  <>
                    <div className="rounded-[18px] border border-[#e5f1e8] bg-[#f9fcfa] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#688472]">
                        Modo atual
                      </p>
                      <p className="mt-2 text-xl font-semibold text-[#1d3b2a]">
                        {status?.mode === 'hermes' ? 'Hermes pronto' : 'Fallback educativo'}
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-[#e5f1e8] bg-[#f9fcfa] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#688472]">
                        Sessao autenticada
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#214130]">
                        {status?.userName || user?.email || 'Sessao ativa'}
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-[#e5f1e8] bg-[#f9fcfa] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#688472]">
                        Memoria disponivel
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#214130]">
                        {status?.hasMemoryContext
                          ? 'Sim. A Score consegue responder usando sinais da sua jornada.'
                          : 'Ainda limitada. A resposta sera mais generica ate a jornada ganhar contexto.'}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border border-[#d7ebdc] bg-white/95">
              <CardHeader className="border-b border-[#e5f1e8]">
                <CardTitle className="flex items-center gap-2 text-lg text-[#1d3b2a]">
                  <Zap className="h-4 w-4 text-[#2d6b48]" />
                  Contexto que a Score pode usar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-5 text-sm text-[#476050]">
                <div className="rounded-[18px] border border-[#e5f1e8] bg-[#f9fcfa] p-4">
                  <p className="font-medium text-[#214130]">Memoria energetica</p>
                  <p className="mt-2 leading-6">
                    {assistantContext.memorySignals.length > 0
                      ? assistantContext.memorySignals.join(', ')
                      : 'Ainda sem sinais fortes registrados.'}
                  </p>
                </div>

                <div className="rounded-[18px] border border-[#e5f1e8] bg-[#f9fcfa] p-4">
                  <p className="font-medium text-[#214130]">Hipoteses de carga</p>
                  <p className="mt-2 leading-6">
                    {assistantContext.loadHypotheses.length > 0
                      ? assistantContext.loadHypotheses.join(', ')
                      : 'Ainda sem hipoteses fortes de carga.'}
                  </p>
                </div>

                <div className="rounded-[18px] border border-[#e5f1e8] bg-[#f9fcfa] p-4">
                  <p className="font-medium text-[#214130]">Fatura em foco</p>
                  {invoiceHistory.length > 0 ? (
                    <select
                      className="mt-3 w-full rounded-[14px] border border-[#d4e8d8] bg-white px-3 py-2 text-sm text-[#214130] outline-none"
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

                <div className="rounded-[18px] border border-[#e5f1e8] bg-[#f9fcfa] p-4">
                  <p className="font-medium text-[#214130]">Jornada atual</p>
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
