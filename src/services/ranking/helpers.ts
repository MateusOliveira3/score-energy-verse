import { getScoreState } from '@/lib/mvpCoreFlow';
import { normalizeState } from '@/lib/mvpJourneyState';
import { RankingEntry, RankingSnapshot } from '@/services/ranking/contracts';
import { MvpState } from '@/types/mvp';

const normalizeRankingScore = (score: number) =>
  Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;

const buildRankingLevelFromScore = (score: number) => Math.max(1, Math.floor(score / 200) + 1);

const getInitials = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

export const buildPublicRankingDisplayName = (state: MvpState, userId: string) => {
  const location = state.profile.location.trim();

  if (location) {
    return `${state.profile.consumerType} em ${location}`;
  }

  return `Usuario ${userId.slice(0, 6)}`;
};

const buildSubtitleFromState = (state: MvpState) => {
  const parts = [state.profile.consumerType];

  if (state.profile.location.trim()) {
    parts.push(state.profile.location.trim());
  }

  return parts.join(' - ');
};

export const buildRankingSnapshotFromState = ({
  userId,
  rawState,
  updatedAt,
}: {
  userId: string;
  rawState: Partial<MvpState> | MvpState;
  updatedAt?: string;
}): RankingSnapshot | null => {
  const state = normalizeState(rawState);

  if (state.scoreEvents.length === 0) {
    return null;
  }

  const scoreState = getScoreState(state.scoreEvents);

  return {
    userId,
    displayName: buildPublicRankingDisplayName(state, userId),
    subtitle: buildSubtitleFromState(state),
    score: scoreState.score,
    level: scoreState.level,
    consumerType: state.profile.consumerType || undefined,
    updatedAt: updatedAt ?? state.lastActiveAt,
  };
};

export const buildRankingEntryFromSnapshot = ({
  snapshot,
  currentUserId,
}: {
  snapshot: RankingSnapshot;
  currentUserId?: string;
}): Omit<RankingEntry, 'position'> => {
  const isCurrentUser = currentUserId === snapshot.userId;
  const score = normalizeRankingScore(snapshot.score);

  return {
    userId: snapshot.userId,
    displayName: isCurrentUser ? 'Voce' : snapshot.displayName,
    subtitle: snapshot.subtitle,
    score,
    level: buildRankingLevelFromScore(score),
    badgeLabel: snapshot.consumerType,
    updatedAt: snapshot.updatedAt,
    isCurrentUser,
  };
};

export const buildRankingEntry = ({
  userId,
  rawState,
  updatedAt,
  currentUserId,
}: {
  userId: string;
  rawState: Partial<MvpState> | MvpState;
  updatedAt?: string;
  currentUserId?: string;
}): Omit<RankingEntry, 'position'> | null => {
  const snapshot = buildRankingSnapshotFromState({
    userId,
    rawState,
    updatedAt,
  });

  if (!snapshot) {
    return null;
  }

  return buildRankingEntryFromSnapshot({
    snapshot,
    currentUserId,
  });
};

export const rankEntries = (
  entries: Array<Omit<RankingEntry, 'position'>>
): RankingEntry[] =>
  [...entries]
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      const rightUpdatedAt = right.updatedAt ? new Date(right.updatedAt).getTime() : 0;
      const leftUpdatedAt = left.updatedAt ? new Date(left.updatedAt).getTime() : 0;

      if (rightUpdatedAt !== leftUpdatedAt) {
        return rightUpdatedAt - leftUpdatedAt;
      }

      return left.displayName.localeCompare(right.displayName);
    })
    .map((entry, index) => ({
      ...entry,
      position: index + 1,
    }));

export const getEntryInitials = (entry: Pick<RankingEntry, 'displayName'>) =>
  getInitials(entry.displayName) || 'SE';
