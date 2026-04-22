import { AlertCircle, Sparkles, Trophy, Users } from 'lucide-react';
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
                  Ranking real da jornada
                </Badge>
                <Badge variant="outline">
                  {rankingScope === 'shared' ? 'Visao compartilhada' : 'Visao atual do usuario'}
                </Badge>
              </div>
              <div className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-3xl text-emerald-700">
                  <Trophy className="h-7 w-7" />
                  <span>Ranking</span>
                </CardTitle>
                <p className="max-w-2xl text-sm text-slate-600">
                  Esta pagina usa dados reais da jornada MVP ja persistidos. O score vem dos eventos
                  da jornada, o nivel e derivado desse score e o contexto do perfil ajuda a
                  identificar cada entrada com honestidade.
                </p>
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
                    <p className="text-sm text-slate-500">Score atual</p>
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
                  O ranking passa a existir quando ha score real salvo na jornada. Assim que o perfil
                  for concluido e a primeira fatura entrar no fluxo MVP, esta pagina deixa de ficar
                  vazia.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Leaderboard entries={rankingEntries} />
        )}

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Alert className="border-emerald-200 bg-white/80">
            <AlertCircle className="h-4 w-4 text-emerald-700" />
            <AlertTitle className="text-emerald-800">Fonte atual dos dados</AlertTitle>
            <AlertDescription className="text-slate-600">
              {sourceLabel || 'Jornadas MVP persistidas'}.
            </AlertDescription>
          </Alert>

          {limitation ? (
            <Alert className="border-amber-200 bg-amber-50/80">
              <AlertCircle className="h-4 w-4 text-amber-700" />
              <AlertTitle className="text-amber-800">Limitacao atual</AlertTitle>
              <AlertDescription className="text-slate-700">{limitation}</AlertDescription>
            </Alert>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default Ranking;
