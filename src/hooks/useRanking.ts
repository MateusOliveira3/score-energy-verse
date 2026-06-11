import { useEffect, useMemo, useState } from 'react';
import { useJourneyIdentity } from '@/hooks/useJourneyIdentity';
import { getRankingService, RankingResult } from '@/services/ranking';

const DEFAULT_RANKING_RESULT: RankingResult = {
  entries: [],
  scope: 'self',
  sourceLabel: '',
};

export const useRanking = () => {
  const { journeyIdentity, loading: identityLoading } = useJourneyIdentity();
  const rankingService = getRankingService();
  const [ranking, setRanking] = useState<RankingResult>(DEFAULT_RANKING_RESULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    if (identityLoading) {
      setLoading(true);
      return () => {
        isActive = false;
      };
    }

    if (!journeyIdentity?.userId) {
      setRanking(DEFAULT_RANKING_RESULT);
      setLoading(false);
      return () => {
        isActive = false;
      };
    }

    setLoading(true);

    void rankingService
      .loadRanking({
        userId: journeyIdentity.userId,
        identitySource: journeyIdentity.source,
        isFallbackIdentity: journeyIdentity.isFallback,
      })
      .then((result) => {
        if (isActive) {
          setRanking(result);
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [identityLoading, journeyIdentity, rankingService]);

  const currentUserEntry = useMemo(
    () => ranking.entries.find((entry) => entry.isCurrentUser),
    [ranking.entries]
  );

  return {
    rankingEntries: ranking.entries,
    rankingScope: ranking.scope,
    sourceLabel: ranking.sourceLabel,
    limitation: ranking.limitation,
    currentUserEntry,
    loading,
    isEmpty: !loading && ranking.entries.length === 0,
  };
};
