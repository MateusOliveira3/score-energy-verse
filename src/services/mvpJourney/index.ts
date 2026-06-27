import { createLocalMvpJourneyService } from '@/services/mvpJourney/localAdapter';
import { MvpJourneyService } from '@/services/mvpJourney/contracts';
import { createSupabaseMvpJourneyService } from '@/services/mvpJourney/supabaseAdapter';
import { isLocalQaForcedRuntime } from '@/lib/localQaRuntime';
import {
  getJourneySupabaseConfigDiagnostics,
  isJourneySupabaseConfigured,
  isSupabaseProviderRequested,
} from '@/services/mvpJourney/supabaseClient';

export type MvpJourneyProvider = 'local' | 'supabase';

const DEFAULT_PROVIDER: MvpJourneyProvider = 'local';

const resolveConfiguredProvider = (): MvpJourneyProvider => {
  if (isLocalQaForcedRuntime()) {
    return 'local';
  }

  const configuredProvider = import.meta.env.VITE_MVP_JOURNEY_PROVIDER?.toLowerCase();

  if (configuredProvider === 'supabase') {
    if (isJourneySupabaseConfigured) {
      return 'supabase';
    }

    console.error(
      '[mvpJourney] VITE_MVP_JOURNEY_PROVIDER is set to supabase, but the Supabase configuration is invalid.',
      getJourneySupabaseConfigDiagnostics()
    );
    return 'supabase';
  }

  return DEFAULT_PROVIDER;
};

let serviceInstance: MvpJourneyService | null = null;
let serviceProvider: MvpJourneyProvider | null = null;

export const getMvpJourneyService = (): MvpJourneyService => {
  if (!serviceInstance) {
    serviceProvider = resolveConfiguredProvider();
    serviceInstance =
      serviceProvider === 'supabase'
        ? createSupabaseMvpJourneyService()
        : createLocalMvpJourneyService();

    if (serviceProvider === 'local' && !isSupabaseProviderRequested) {
      console.info('[mvpJourney] Using local adapter for MVP journey state.');
    }

    if (serviceProvider === 'supabase') {
      console.info('[mvpJourney] Using Supabase adapter for MVP journey state.');
    }
  }

  return serviceInstance;
};

export const getActiveMvpJourneyProvider = (): MvpJourneyProvider =>
  serviceProvider ?? resolveConfiguredProvider();

export * from '@/services/mvpJourney/contracts';
