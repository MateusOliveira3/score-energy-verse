import {
  BrainCircuit,
  CheckCircle2,
  Circle,
  Clock3,
  HelpCircle,
  LibraryBig,
  ShieldCheck,
  Sprout,
} from 'lucide-react';
import { MemorySnapshot } from '@/lib/memorySnapshot';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MemoryPanelProps {
  snapshot: MemorySnapshot;
}

const formatOccurredAt = (value?: string) => {
  if (!value) {
    return undefined;
  }

  try {
    return format(new Date(value), 'MMMM', { locale: ptBR });
  } catch (_error) {
    return undefined;
  }
};

const MemoryPanel = ({ snapshot }: MemoryPanelProps) => {
  const {
    focusedInvoiceLabel,
    memoryProfile,
    memoryTimeline,
    memoryInsights,
    memoryGaps,
    memoryEvidence,
    memoryKnowledge,
  } = snapshot;

  return (
    <section
      id="memory-panel"
      className="scroll-mt-24 rounded-[24px] border border-[#264c46] bg-[#0a2c28]/85 p-5 text-white"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9dbfa6]">
            Memory Visibility
          </p>
          <h2 className="text-2xl font-semibold text-[#f5f8f3]">Memoria visivel da jornada</h2>
          <p className="mt-1 max-w-3xl text-sm text-[#c5d8c8]">
            Memoria Energetica mostra o que aprendemos sobre voce. Conhecimento Energetico
            mostra o que voce aprendeu com a Score. Este painel apenas organiza essas duas
            camadas sem alterar nenhuma regra da jornada.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge className="border border-[#365f58] bg-[#103a35] text-[#f5f8f3]">
              Memoria Energetica: o que aprendemos sobre voce
            </Badge>
            <Badge className="border border-[#365f58] bg-[#103a35] text-[#f5f8f3]">
              Conhecimento Energetico: o que voce aprendeu com a Score
            </Badge>
          </div>
        </div>

        {focusedInvoiceLabel && (
          <Badge className="w-fit border border-[#365f58] bg-[#103a35] text-[#f5f8f3]">
            Fatura em foco: {focusedInvoiceLabel}
          </Badge>
        )}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card className="border border-[#365f58] bg-[#103a35] text-white shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-[#f5f8f3]">
              <BrainCircuit className="h-5 w-5 text-[#8fd08e]" />
              <span>O que aprendemos sobre voce</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              {memoryProfile.items.map((item) => (
                <div
                  key={`${item.label}-${item.value}`}
                  className="flex items-start justify-between gap-3 rounded-[16px] border border-[#2d5b54] bg-[#123f39] px-4 py-3"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#8fd08e]" />
                    <div>
                      <p className="text-sm font-medium text-[#f5f8f3]">{item.value}</p>
                      <p className="text-xs text-[#9dbfa6]">{item.label}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-[#365f58] bg-[#143d37] text-[#d9ead8]">
                    {item.source}
                  </Badge>
                </div>
              ))}
            </div>

            <div>
              <p className="text-sm font-semibold text-[#f5f8f3]">Sinais confirmados</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {memoryProfile.confirmedSignals.length > 0 ? (
                  memoryProfile.confirmedSignals.map((signal) => (
                    <Badge
                      key={signal}
                      variant="outline"
                      className="border-[#365f58] bg-[#143d37] text-[#d9ead8]"
                    >
                      {signal}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-[#c5d8c8]">
                    Ainda estamos construindo sinais confirmados com base no que voce responde e envia.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#365f58] bg-[#103a35] text-white shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-[#f5f8f3]">
              <LibraryBig className="h-5 w-5 text-[#8fd08e]" />
              <span>Como sua jornada evoluiu</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {memoryTimeline.items.length > 0 ? (
                memoryTimeline.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[16px] border border-[#2d5b54] bg-[#123f39] px-4 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#8fd08e]" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {formatOccurredAt(item.occurredAt) && (
                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9dbfa6]">
                              {formatOccurredAt(item.occurredAt)}
                            </span>
                          )}
                          <p className="text-sm font-medium text-[#f5f8f3]">{item.title}</p>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-[#c5d8c8]">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#c5d8c8]">
                  A linha do tempo vai aparecer conforme a jornada acumular perfil, faturas, analises e acoes.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#365f58] bg-[#103a35] text-white shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-[#f5f8f3]">
              <Sprout className="h-5 w-5 text-[#8fd08e]" />
              <span>Conhecimentos adquiridos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-[16px] border border-[#2d5b54] bg-[#123f39] px-4 py-3">
              <p className="text-sm leading-6 text-[#d9ead8]">
                Aqui fica o que voce ja aprendeu com a Score. Diferente da memoria,
                isso nao descreve o seu perfil: descreve os conceitos que voce ja
                incorporou na jornada.
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#9dbfa6]">
                {memoryKnowledge.learnedCount} de {memoryKnowledge.totalCount} conhecimentos entendidos
              </p>
            </div>

            <div className="space-y-3">
              {memoryKnowledge.items.map((knowledge) => (
                <div
                  key={knowledge.id}
                  className="flex items-start gap-3 rounded-[16px] border border-[#2d5b54] bg-[#123f39] px-4 py-3"
                >
                  {knowledge.learned ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#8fd08e]" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-[#9dbfa6]" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#f5f8f3]">{knowledge.title}</p>
                    <p className="text-xs uppercase tracking-[0.14em] text-[#9dbfa6]">
                      {knowledge.category.replaceAll('_', ' ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#365f58] bg-[#103a35] text-white shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-[#f5f8f3]">
              <HelpCircle className="h-5 w-5 text-[#8fd08e]" />
              <span>O que ainda queremos entender</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {memoryGaps.items.length > 0 ? (
              memoryGaps.items.map((gap) => (
                <div
                  key={gap}
                  className="flex items-start gap-3 rounded-[16px] border border-[#2d5b54] bg-[#123f39] px-4 py-3"
                >
                  <span className="mt-0.5 text-base font-semibold text-[#f3d88b]">?</span>
                  <p className="text-sm leading-6 text-[#d9ead8]">{gap}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[16px] border border-[#2d5b54] bg-[#123f39] px-4 py-4">
                <p className="text-sm leading-6 text-[#d9ead8]">
                  As principais lacunas visiveis desta jornada ja foram respondidas com os dados atuais.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-[#365f58] bg-[#103a35] text-white shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-[#f5f8f3]">
              <ShieldCheck className="h-5 w-5 text-[#8fd08e]" />
              <span>Como montamos sua recomendacao</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-[16px] border border-[#2d5b54] bg-[#123f39] p-4">
              <p className="text-sm font-semibold text-[#f5f8f3]">Memoria ativa agora</p>

              {memoryInsights.facts.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9dbfa6]">
                    Fatos consolidados
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {memoryInsights.facts.map((fact) => (
                      <Badge
                        key={fact}
                        variant="outline"
                        className="border-[#365f58] bg-[#143d37] text-[#d9ead8]"
                      >
                        {fact}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {memoryInsights.confirmedContext.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9dbfa6]">
                    Contexto confirmado
                  </p>
                  <div className="mt-2 space-y-2">
                    {memoryInsights.confirmedContext.map((item) => (
                      <p key={item} className="text-sm leading-6 text-[#d9ead8]">
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {memoryInsights.observedBehavior.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9dbfa6]">
                    Comportamento observado
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {memoryInsights.observedBehavior.map((item) => (
                      <Badge
                        key={item}
                        variant="outline"
                        className="border-[#365f58] bg-[#143d37] text-[#d9ead8]"
                      >
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-[16px] border border-[#2d5b54] bg-[#123f39] p-4">
              <p className="text-sm font-semibold text-[#f5f8f3]">Dados utilizados</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {memoryEvidence.dataUsed.map((item) => (
                  <Badge
                    key={`${item.label}-${item.detail}`}
                    variant="outline"
                    className="border-[#365f58] bg-[#143d37] text-[#d9ead8]"
                  >
                    {item.label}: {item.detail}
                  </Badge>
                ))}
              </div>

              {memoryEvidence.recommendationEvidence.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9dbfa6]">
                    Evidencias que sustentam a recomendacao atual
                  </p>
                  <div className="mt-2 space-y-2">
                    {memoryEvidence.recommendationEvidence.map((item) => (
                      <p key={item} className="text-sm leading-6 text-[#d9ead8]">
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default MemoryPanel;
