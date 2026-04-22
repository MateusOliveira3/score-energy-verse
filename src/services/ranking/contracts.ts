import { JourneyRequestContext } from '@/services/mvpJourney/contracts';

export type RankingScope = 'shared' | 'self';

export interface RankingEntry {
  userId: string;
  position: number;
  displayName: string;
  subtitle: string;
  score: number;
  level: number;
  badgeLabel?: string;
  updatedAt?: string;
  isCurrentUser: boolean;
}

export interface RankingSnapshot {
  userId: string;
  displayName: string;
  subtitle: string;
  score: number;
  level: number;
  consumerType?: string;
  updatedAt?: string;
}

export interface LoadRankingInput extends JourneyRequestContext {}

export interface RankingResult {
  entries: RankingEntry[];
  scope: RankingScope;
  sourceLabel: string;
  limitation?: string;
}

export interface RankingService {
  loadRanking(input: LoadRankingInput): Promise<RankingResult>;
}
