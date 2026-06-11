import { MVP_PERSISTENCE_KEYS } from '@/lib/mvpPersistence';
import { LoadRankingInput, RankingResult, RankingService } from '@/services/ranking/contracts';
import { buildRankingEntry, rankEntries } from '@/services/ranking/helpers';
import { MvpState } from '@/types/mvp';

const isBrowser = () => typeof window !== 'undefined';

const readStoredState = (storageKey: string): Partial<MvpState> | null => {
  if (!isBrowser()) {
    return null;
  }

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Partial<MvpState>;
  } catch (_error) {
    return null;
  }
};

const getAllRankingStorageKeys = () => {
  if (!isBrowser()) {
    return [];
  }

  const prefix = MVP_PERSISTENCE_KEYS.state('');
  const keys: string[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    if (key?.startsWith(prefix)) {
      keys.push(key);
    }
  }

  return keys;
};

const getUserIdFromStorageKey = (storageKey: string) => storageKey.split(':').pop() ?? 'anonymous';

export const createLocalRankingService = (): RankingService => ({
  loadRanking: async ({ userId }: LoadRankingInput): Promise<RankingResult> => {
    const entries = rankEntries(
      getAllRankingStorageKeys()
        .map((storageKey) => {
          const state = readStoredState(storageKey);

          if (!state) {
            return null;
          }

          return buildRankingEntry({
            userId: getUserIdFromStorageKey(storageKey),
            rawState: state,
            currentUserId: userId,
          });
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    );

    return {
      entries,
      scope: 'shared',
      sourceLabel: 'Dados reais visiveis neste navegador',
    };
  },
});
