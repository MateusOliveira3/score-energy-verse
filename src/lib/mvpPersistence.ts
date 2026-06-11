import { MvpState } from '@/types/mvp';
import {
  DEFAULT_MVP_STATE,
  LegacyStoredJourneyState,
  normalizeState,
} from '@/lib/mvpJourneyState';

const STORAGE_NAMESPACE = 'score-energy';
const STORAGE_DOMAIN = 'mvp-journey';
const STORAGE_VERSION = 1;
const LEGACY_STORAGE_PREFIX = 'score-energy-mvp-core-flow';

const isBrowser = () => typeof window !== 'undefined';

export const MVP_PERSISTENCE_KEYS = {
  state: (userId?: string) =>
    `${STORAGE_NAMESPACE}:${STORAGE_DOMAIN}:v${STORAGE_VERSION}:${userId ?? 'anonymous'}`,
  legacyState: (userId?: string) =>
    userId ? `${LEGACY_STORAGE_PREFIX}:${userId}` : `${LEGACY_STORAGE_PREFIX}:anonymous`,
};

const readStoredState = (storageKey: string) => {
  if (!isBrowser()) {
    return null;
  }

  const rawState = window.localStorage.getItem(storageKey);
  if (!rawState) {
    return null;
  }

  try {
    return JSON.parse(rawState) as Partial<MvpState>;
  } catch (_error) {
    return null;
  }
};

const readLegacyState = (storageKey: string) => {
  if (!isBrowser()) {
    return null;
  }

  const rawState = window.localStorage.getItem(storageKey);
  if (!rawState) {
    return null;
  }

  try {
    return JSON.parse(rawState) as LegacyStoredJourneyState;
  } catch (_error) {
    return null;
  }
};

export const loadState = (userId?: string): MvpState => {
  if (!isBrowser()) {
    return DEFAULT_MVP_STATE;
  }

  const nextKey = MVP_PERSISTENCE_KEYS.state(userId);
  const storedState = readStoredState(nextKey);
  if (storedState) {
    return normalizeState(storedState);
  }

  const legacyKey = MVP_PERSISTENCE_KEYS.legacyState(userId);
  const legacyState = readLegacyState(legacyKey);
  if (!legacyState) {
    return DEFAULT_MVP_STATE;
  }

  const migratedState = normalizeState(undefined, legacyState);
  saveState(userId, migratedState);
  window.localStorage.removeItem(legacyKey);
  return migratedState;
};

export const saveState = (userId: string | undefined, state: MvpState): MvpState => {
  const normalizedState = normalizeState({
    ...state,
    lastActiveAt: new Date().toISOString(),
  });

  if (!isBrowser()) {
    return normalizedState;
  }

  window.localStorage.setItem(
    MVP_PERSISTENCE_KEYS.state(userId),
    JSON.stringify(normalizedState)
  );

  return normalizedState;
};
