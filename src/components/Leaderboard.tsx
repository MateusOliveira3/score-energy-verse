import React from 'react';
import { Award, Medal, ShieldCheck, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RankingEntry } from '@/services/ranking';
import { getEntryInitials } from '@/services/ranking/helpers';

interface LeaderboardProps {
  entries: RankingEntry[];
}

const medalIconByPosition = {
  1: Trophy,
  2: Medal,
  3: Award,
} as const;

const Leaderboard = ({ entries }: LeaderboardProps) => (
  <div className="score-card rounded-[28px] p-5">
    <div className="mb-5 space-y-2">
      <p className="score-caption">Ranking</p>
      <h2 className="text-2xl font-semibold text-[var(--score-ink)]">Jornadas pontuadas</h2>
      <p className="text-sm leading-6 text-[var(--score-ink-soft)]">
        O ranking continua vindo da mesma fonte atual. O visual novo so torna mais claro como score,
        nivel e contexto leve se conectam.
      </p>
    </div>

    <div className="space-y-3">
      {entries.map((entry) => {
        const MedalIcon = medalIconByPosition[entry.position as 1 | 2 | 3];

        return (
          <div
            key={entry.userId}
            className={`rounded-[22px] border px-4 py-4 transition ${
              entry.isCurrentUser
                ? 'border-[rgba(21,163,90,0.22)] bg-[var(--score-green-soft)]'
                : 'border-[var(--score-line)] bg-[var(--score-surface)]'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--score-surface-soft)] text-[var(--score-green-deep)]">
                {MedalIcon ? (
                  <MedalIcon className="h-5 w-5" />
                ) : (
                  <span className="score-display text-sm font-bold">#{entry.position}</span>
                )}
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--score-green)] text-sm font-bold text-white">
                {getEntryInitials(entry)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold text-[var(--score-ink)]">{entry.displayName}</p>
                  {entry.isCurrentUser && (
                    <Badge className="bg-[var(--score-green)] text-white hover:bg-[var(--score-green)]">
                      Voce
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-[var(--score-ink-soft)]">{entry.subtitle}</p>
              </div>

              <div className="text-right">
                <p className="score-display text-2xl font-bold text-[var(--score-ink)]">
                  {entry.score.toLocaleString('pt-BR')}
                </p>
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--score-ink-faint)]">
                  nivel {entry.level}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline" className="border-[var(--score-line)] bg-white text-[var(--score-ink-soft)]">
                Score explicavel
              </Badge>
              {entry.badgeLabel && (
                <Badge variant="outline" className="border-[var(--score-line)] bg-white text-[var(--score-ink-soft)]">
                  {entry.badgeLabel}
                </Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>

    <div className="mt-5 rounded-[22px] border border-[var(--score-line)] bg-[var(--score-surface-soft)] px-4 py-4">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 text-[var(--score-green-deep)]" />
        <p className="text-sm leading-6 text-[var(--score-ink-soft)]">
          O ranking continua refletindo eventos validos de score e nao vira competicao paralela sem base de jornada.
        </p>
      </div>
    </div>
  </div>
);

export default Leaderboard;
