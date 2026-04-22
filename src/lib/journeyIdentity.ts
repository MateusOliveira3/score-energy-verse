import { User } from '@supabase/supabase-js';

export type JourneyIdentitySource =
  | 'authenticated'
  | 'local-auth-fallback'
  | 'development-fallback';

export interface JourneyIdentity {
  userId: string;
  source: JourneyIdentitySource;
  isFallback: boolean;
}

const JOURNEY_FALLBACK_STORAGE_KEY = 'score-energy-mvp-journey-fallback-identity';

const isBrowser = () => typeof window !== 'undefined';

const readStoredFallbackIdentity = () => {
  if (!isBrowser()) {
    return null;
  }

  const raw = window.localStorage.getItem(JOURNEY_FALLBACK_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<JourneyIdentity>;
    if (
      typeof parsed.userId === 'string' &&
      parsed.userId.trim() &&
      parsed.source === 'development-fallback'
    ) {
      return parsed as JourneyIdentity;
    }
  } catch (_error) {
    return null;
  }

  return null;
};

const createDevelopmentFallbackIdentity = (): JourneyIdentity => {
  const userId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? `dev-fallback:${crypto.randomUUID()}`
      : `dev-fallback:${Date.now()}`;

  return {
    userId,
    source: 'development-fallback',
    isFallback: true,
  };
};

export const getOrCreateDevelopmentJourneyIdentity = (): JourneyIdentity => {
  const existingIdentity = readStoredFallbackIdentity();
  if (existingIdentity) {
    return existingIdentity;
  }

  const nextIdentity = createDevelopmentFallbackIdentity();

  if (isBrowser()) {
    window.localStorage.setItem(JOURNEY_FALLBACK_STORAGE_KEY, JSON.stringify(nextIdentity));
  }

  return nextIdentity;
};

export const resolveJourneyIdentity = (user: User | null): JourneyIdentity => {
  if (user?.id) {
    const isLocalAuthFallback =
      user.app_metadata?.provider === 'local-fallback' || user.user_metadata?.mode === 'local-fallback';

    return {
      userId: user.id,
      source: isLocalAuthFallback ? 'local-auth-fallback' : 'authenticated',
      isFallback: isLocalAuthFallback,
    };
  }

  return getOrCreateDevelopmentJourneyIdentity();
};
