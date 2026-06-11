import { createLocalRankingService } from '@/services/ranking/localAdapter';
import { RankingService } from '@/services/ranking/contracts';
import { createSupabaseRankingService } from '@/services/ranking/supabaseAdapter';
import { getActiveMvpJourneyProvider } from '@/services/mvpJourney';

let rankingServiceInstance: RankingService | null = null;

export const getRankingService = (): RankingService => {
  if (!rankingServiceInstance) {
    rankingServiceInstance =
      getActiveMvpJourneyProvider() === 'supabase'
        ? createSupabaseRankingService()
        : createLocalRankingService();
  }

  return rankingServiceInstance;
};

export * from '@/services/ranking/contracts';
