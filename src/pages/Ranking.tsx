import { AlertCircle, ShieldCheck, Sparkles, Trophy, Users } from 'lucide-react';
import Leaderboard from '@/components/Leaderboard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRanking } from '@/hooks/useRanking';

const RankingLoading = () => (
  <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
    <div className="score-card rounded-[28px] p-5">
      <Skeleton className="h-6 w-28" />
      <Skeleton className="mt-4 h-14 w-4/5" />
      <Skeleton className="mt-4 h-5 w-full" />
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-24 w-full rounded-[20px]" />
        <Skeleton className="h-24 w-full rounded-[20px]" />
        <Skeleton className="h-24 w-full rounded-[20px]" />
      </div>
    </div>
    <div className="score-card rounded-[28px] p-5">
      <Skeleton className="h-12 w-full rounded-[18px]" />
      <Skeleton className="mt-3 h-12 w-full rounded-[18px]" />
      <Skeleton className="mt-3 h-12 w-full rounded-[18px]" />
    </div>
  </div>
);

const Ranking = () => {
  const {
    rankingEntries,
    rankingScope,
    sourceLabel,
    limitation,
    currentUserEntry,
    loading,
    isEmpty,
  } = useRanking();

  return (
    <main className="score-shell min-h-screen px-4 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="score-card rounded-[30px] p-6">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-[var(--score-green)] text-white hover:bg-[var(--score-green)]">
                Ranking de jornada real
              </Badge>
              <Badge variant="outline" className="border-[var(--score-line)] bg-white text-[var(--score-ink-soft)]">
                {rankingScope === 'shared' ? 'Visao compartilhada' : 'Visao atual do usuario'}
              </Badge>
            </div>

            <div className="mt-5 space-y-3">
              <p className="score-caption">Ranking</p>
              <h1 className="score-display text-4xl font-bold text-[var(--score-ink)]">
                Score coletivo com a mesma logica de jornada
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-[var(--score-ink-soft)]">
                O ranking continua lendo score, nivel e contexto leve da fonte atual. A mudanca aqui
                e apenas de apresentacao: menos ruina visual, mais legibilidade do progresso.
              </p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] bg-[var(--score-surface-soft)] px-4 py-4">
                <Trophy className="h-4 w-4 text-[var(--score-green-deep)]" />
                <p className="mt-3 text-sm font-semibold text-[var(--score-ink)]">Eventos validos</p>
                <p className="mt-1 text-sm leading-6 text-[var(--score-ink-soft)]">
                  Perfil, fatura, analise e acoes continuam formando a base do score.
                </p>
              </div>
              <div className="rounded-[22px] bg-[var(--score-surface-soft)] px-4 py-4">
                <ShieldCheck className="h-4 w-4 text-[var(--score-green-deep)]" />
                <p className="mt-3 text-sm font-semibold text-[var(--score-ink)]">Score consistente</p>
                <p className="mt-1 text-sm leading-6 text-[var(--score-ink-soft)]">
                  A normalizacao exibida aqui continua a mesma do restante da jornada.
                </p>
              </div>
              <div className="rounded-[22px] bg-[var(--score-surface-soft)] px-4 py-4">
                <Users className="h-4 w-4 text-[var(--score-green-deep)]" />
                <p className="mt-3 text-sm font-semibold text-[var(--score-ink)]">Leitura coletiva</p>
                <p className="mt-1 text-sm leading-6 text-[var(--score-ink-soft)]">
                  Nivel e score ajudam a comparar progresso sem virar dado solto.
                </p>
              </div>
            </div>
          </div>

          <div className="score-stage rounded-[30px] px-6 py-6 text-white">
            <p className="score-caption text-[#7fe3ae]">Seu lugar agora</p>
            {loading ? (
              <div className="mt-5 space-y-3">
                <Skeleton className="h-10 w-28 bg-white/10" />
                <Skeleton className="h-14 w-full bg-white/10" />
                <Skeleton className="h-10 w-2/3 bg-white/10" />
              </div>
            ) : currentUserEntry ? (
              <div className="mt-5 space-y-4">
                <p className="score-display text-6xl font-bold">#{currentUserEntry.position}</p>
                <div className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                    Score atual
                  </p>
                  <p className="score-display mt-2 text-3xl font-bold">
                    {currentUserEntry.score.toLocaleString('pt-BR')} pts
                  </p>
                  <p className="mt-2 text-sm text-white/72">
                    Nivel {currentUserEntry.level}
                    {currentUserEntry.badgeLabel ? ` · ${currentUserEntry.badgeLabel}` : ''}
                  </p>
                </div>
                <p className="text-sm leading-6 text-white/72">
                  Sua posicao reflete eventos ja persistidos na jornada. Continue enviando faturas e
                  acompanhando acoes para subir com o mesmo score explicavel.
                </p>
              </div>
            ) : (
              <div className="mt-5 rounded-[22px] border border-white/10 bg-white/6 px-4 py-4">
                <p className="text-lg font-semibold text-white">Sem pontuacao registrada ainda</p>
                <p className="mt-2 text-sm leading-6 text-white/72">
                  Complete perfil, envie a primeira fatura e acompanhe a proxima acao para aparecer aqui.
                </p>
              </div>
            )}
          </div>
        </section>

        {loading ? (
          <RankingLoading />
        ) : isEmpty ? (
          <Card className="score-card rounded-[28px] border-dashed">
            <CardContent className="space-y-3 px-6 py-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--score-green-soft)] text-[var(--score-green-deep)]">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="text-xl font-semibold text-[var(--score-ink)]">
                Ainda nao existe jornada pontuada para mostrar
              </p>
              <p className="mx-auto max-w-2xl text-sm leading-6 text-[var(--score-ink-soft)]">
                O ranking aparece quando ha eventos validos de score. Continue a jornada para transformar progresso em leitura comparavel.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Leaderboard entries={rankingEntries} />
        )}

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="score-card rounded-[24px] px-5 py-5">
            <p className="score-caption">Fonte</p>
            <p className="mt-2 text-sm leading-6 text-[var(--score-ink-soft)]">
              Usamos {sourceLabel || 'jornadas MVP persistidas'} e exibimos apenas o necessario para
              leaderboard: posicao, score, nivel e contexto leve do perfil.
            </p>
          </div>

          {limitation ? (
            <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 text-amber-700" />
                <p className="text-sm leading-6 text-amber-900">
                  {limitation} Mesmo assim, a tela continua apresentando ranking como leitura de jornada, nao como competicao auditada por backend dedicado.
                </p>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
};

export default Ranking;
