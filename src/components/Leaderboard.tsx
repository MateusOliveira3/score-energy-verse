import React from 'react';
import { Trophy, Medal, Award, ShieldCheck, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RankingEntry } from '@/services/ranking';
import { getEntryInitials } from '@/services/ranking/helpers';

interface LeaderboardProps {
  entries: RankingEntry[];
}

const Leaderboard = ({ entries }: LeaderboardProps) => {
  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-gray-500">#{position}</span>;
    }
  };

  return (
    <Card className="h-fit border-2 border-emerald-100 shadow-lg">
      <CardHeader className="pb-4">
        <div className="space-y-2">
          <CardTitle className="flex items-center space-x-2 text-emerald-700">
            <Trophy className="h-5 w-5" />
            <span>Jornadas pontuadas</span>
          </CardTitle>
          <p className="text-sm text-slate-600">
            Lista ordenada por score de eventos validos, com nivel e contexto do perfil para dar
            sentido a cada posicao.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.userId}
              className={`flex items-center space-x-3 rounded-lg p-3 transition-colors ${
                entry.isCurrentUser
                  ? 'border-2 border-green-200 bg-gradient-to-r from-green-100 to-emerald-100'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex w-8 items-center justify-center">
                {getPositionIcon(entry.position)}
              </div>

              <Avatar className="h-10 w-10">
                <AvatarFallback
                  className={
                    entry.isCurrentUser ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                  }
                >
                  {getEntryInitials(entry)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="font-medium text-gray-800">
                  {entry.displayName}
                  {entry.isCurrentUser && (
                    <span className="ml-2 rounded-full bg-green-500 px-2 py-1 text-xs text-white">
                      Voce
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">{entry.subtitle}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold text-emerald-700">
                    {entry.score.toLocaleString('pt-BR')} pontos
                  </span>
                  <Badge variant="secondary">Nivel {entry.level}</Badge>
                  <Badge variant="outline" className="bg-white">
                    Score explicavel
                  </Badge>
                  {entry.badgeLabel && <Badge variant="outline">{entry.badgeLabel}</Badge>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg bg-gradient-to-r from-blue-50 to-emerald-50 p-4">
          <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <div>
                <span className="font-medium">Base do ranking</span>
                <p className="mt-1 text-xs leading-5">
                  Score salvo na jornada e derivado de eventos validos.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
              <div>
                <span className="font-medium">Leitura de progresso</span>
                <p className="mt-1 text-xs leading-5">
                  Nivel e contexto ajudam a entender evolucao, nao apenas posicao.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
