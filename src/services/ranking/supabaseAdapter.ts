import {
  LoadRankingInput,
  RankingResult,
  RankingService,
  RankingSnapshot,
} from '@/services/ranking/contracts';
import { buildRankingEntryFromSnapshot, buildRankingSnapshotFromState, rankEntries } from '@/services/ranking/helpers';
import {
  createJourneySupabaseClient,
  isJourneySupabaseConfigured,
} from '@/services/mvpJourney/supabaseClient';
import { JourneyRequestContext } from '@/services/mvpJourney/contracts';
import { MvpState } from '@/types/mvp';
import { SupabaseClient } from '@supabase/supabase-js';

const RANKING_TABLE = 'ranking_entries';

type JourneyRankingRow = {
  user_id: string;
  display_name: string;
  score: number;
  level: number;
  consumer_type: string | null;
  updated_at: string;
};

const SHARED_MODEL_LIMITATION =
  'As linhas do ranking ainda sao derivadas no cliente a partir da propria jornada do usuario. A leitura compartilhada ja existe, mas a derivacao ainda nao e validada por um backend dedicado.';

const buildSnapshotFromRow = (row: JourneyRankingRow): RankingSnapshot => ({
  userId: row.user_id,
  displayName: row.display_name,
  subtitle: row.consumer_type ?? 'Jornada Score Energy',
  score: row.score,
  level: row.level,
  consumerType: row.consumer_type ?? undefined,
  updatedAt: row.updated_at,
});

export const syncSupabaseRankingEntry = async ({
  supabase,
  context,
  state,
}: {
  supabase: SupabaseClient;
  context: JourneyRequestContext;
  state: MvpState;
}) => {
  if (!isJourneySupabaseConfigured || !context.userId) {
    return;
  }

  const snapshot = buildRankingSnapshotFromState({
    userId: context.userId,
    rawState: state,
    updatedAt: new Date().toISOString(),
  });

  if (!snapshot) {
    return;
  }

  const { error } = await supabase.from(RANKING_TABLE).upsert(
    {
      user_id: snapshot.userId,
      display_name: snapshot.displayName,
      score: snapshot.score,
      level: snapshot.level,
      consumer_type: snapshot.consumerType ?? null,
      updated_at: snapshot.updatedAt ?? new Date().toISOString(),
    },
    {
      onConflict: 'user_id',
    }
  );

  if (error) {
    console.warn('Nao foi possivel sincronizar a entrada compartilhada de ranking no Supabase:', error);
  }
};

export const createSupabaseRankingService = (): RankingService => {
  const supabase = createJourneySupabaseClient();

  return {
    loadRanking: async ({ userId }: LoadRankingInput): Promise<RankingResult> => {
      if (!supabase || !isJourneySupabaseConfigured || !userId) {
        return {
          entries: [],
          scope: 'shared',
          sourceLabel: 'Leaderboard compartilhado do Supabase',
          limitation: SHARED_MODEL_LIMITATION,
        };
      }

      const { data, error } = await supabase
        .from(RANKING_TABLE)
        .select('user_id, display_name, score, level, consumer_type, updated_at')
        .gt('score', 0)
        .order('score', { ascending: false })
        .order('updated_at', { ascending: false });

      if (error) {
        console.warn('Nao foi possivel carregar o ranking MVP no Supabase:', error);

        return {
          entries: [],
          scope: 'shared',
          sourceLabel: 'Leaderboard compartilhado do Supabase',
          limitation: SHARED_MODEL_LIMITATION,
        };
      }

      const entries = rankEntries(
        ((data as JourneyRankingRow[] | null) ?? [])
          .map((row) =>
            buildRankingEntryFromSnapshot({
              snapshot: buildSnapshotFromRow(row),
              currentUserId: userId,
            })
          )
          .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      );

      return {
        entries,
        scope: 'shared',
        sourceLabel: 'Leaderboard compartilhado do Supabase',
        limitation: SHARED_MODEL_LIMITATION,
      };
    },
  };
};
