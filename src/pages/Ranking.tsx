import { AlertCircle, CheckCircle2, ShieldCheck, Sparkles, Trophy, Users } from 'lucide-react';
import Leaderboard from '@/components/Leaderboard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRanking } from '@/hooks/useRanking';

const RankingLoading = () => (
  <div className="space-y-6">
    <Card className="border-2 border-emerald-100 shadow-lg">
      <CardContent className="space-y-4 p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-24 w-full" />
      </CardContent>
    </Card>
    <Card className="border-2 border-slate-100 shadow-lg">
      <CardContent className="space-y-4 p-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-cyan-50">
      <main className="container mx-auto space-y-8 px-4 py-8">
        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <Card className="border-2 border-emerald-100 shadow-lg">
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                  Ranking de jornada real
                </Badge>
                <Badge variant="outline">
                  {rankingScope === 'shared' ? 'Visao compartilhada' : 'Visao atual do usuario'}
                </Badge>
                <Badge variant="outline">Score explicavel</Badge>
              </div>
              <div className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-3xl text-emerald-700">
                  <Trophy className="h-7 w-7" />
                  <span>Ranking Score Energy</span>
                </CardTitle>
                <p className="max-w-2xl text-sm text-slate-600">
                  Cada posicao nasce do score salvo na jornada: eventos validos contam pontos,
                  o nivel mostra progressao e o perfil ajuda a dar contexto sem expor dados privados.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900">
                  <CheckCircle2 className="mb-2 h-4 w-4 text-emerald-700" />
                  <span className="font-semibold">Eventos validos</span>
                  <p className="mt-1 text-xs leading-5 text-emerald-800">
                    Perfil, fatura, analise e acoes revisadas formam a base do score.
                  </p>
                </div>
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
                  <ShieldCheck className="mb-2 h-4 w-4 text-blue-700" />
                  <span className="font-semibold">Score consistente</span>
                  <p className="mt-1 text-xs leading-5 text-blue-800">
                    A pontuacao exibida segue a mesma normalizacao usada no restante da jornada.
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                  <Trophy className="mb-2 h-4 w-4 text-amber-600" />
                  <span className="font-semibold">Progresso comparavel</span>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Nivel e score ajudam a comparar evolucao sem transformar o ranking em dado solto.
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-2 border-slate-100 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-700">
                <Users className="h-5 w-5" />
                <span>Seu lugar agora</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-5 w-40" />
                </div>
              ) : currentUserEntry ? (
                <div className="space-y-3">
                  <div className="text-4xl font-bold text-emerald-700">
                    #{currentUserEntry.position}
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Score explicavel da jornada</p>
                    <p className="text-2xl font-semibold text-slate-800">
                      {currentUserEntry.score.toLocaleString('pt-BR')} pontos
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">Nivel {currentUserEntry.level}</Badge>
                    {currentUserEntry.badgeLabel && (
                      <Badge variant="outline">{currentUserEntry.badgeLabel}</Badge>
                    )}
                  </div>
                  <p className="text-sm leading-6 text-slate-600">
                    Sua posicao reflete eventos ja registrados na jornada. Continue evoluindo com
                    acoes e novas faturas para subir de nivel.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Sem pontuacao registrada ainda</p>
                  <p className="text-sm text-slate-600">
                    Complete etapas reais da jornada, como perfil e envio de fatura, para aparecer no
                    ranking.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {loading ? (
          <RankingLoading />
        ) : isEmpty ? (
          <Card className="border-2 border-dashed border-slate-200 shadow-sm">
            <CardContent className="space-y-3 p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Sparkles className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-slate-800">
                  Ainda nao existe jornada pontuada para mostrar
                </p>
                <p className="mx-auto max-w-2xl text-sm text-slate-600">
                  O ranking aparece quando ha eventos validos de score na jornada. Complete o perfil
                  e envie a primeira fatura para transformar progresso real em pontuacao comparavel.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Leaderboard entries={rankingEntries} />
        )}

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Alert className="border-emerald-200 bg-white/80">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            <AlertTitle className="text-emerald-800">Como este ranking e formado</AlertTitle>
            <AlertDescription className="text-slate-600">
              Usamos {sourceLabel || 'jornadas MVP persistidas'} e exibimos apenas campos de
              leaderboard: posicao, score, nivel e contexto leve do perfil.
            </AlertDescription>
          </Alert>

          {limitation ? (
            <Alert className="border-amber-200 bg-amber-50/80">
              <AlertCircle className="h-4 w-4 text-amber-700" />
              <AlertTitle className="text-amber-800">Transparencia do MVP</AlertTitle>
              <AlertDescription className="text-slate-700">
                {limitation} Mesmo assim, a tela sempre apresenta o ranking como uma leitura de
                jornada, nao como uma competicao auditada por backend dedicado.
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default Ranking;
