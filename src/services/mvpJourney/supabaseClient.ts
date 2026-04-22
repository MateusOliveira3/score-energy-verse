import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const configuredProvider = import.meta.env.VITE_MVP_JOURNEY_PROVIDER?.toLowerCase();

export const isJourneySupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const isSupabaseProviderRequested = configuredProvider === 'supabase';

const hasValidSupabaseUrl = () => {
  if (!supabaseUrl) {
    return false;
  }

  try {
    const parsedUrl = new URL(supabaseUrl);
    return parsedUrl.protocol === 'https:' && !parsedUrl.pathname.includes('/rest/v1/');
  } catch (_error) {
    return false;
  }
};

const hasPublishableAnonKey = () =>
  typeof supabaseAnonKey === 'string' && supabaseAnonKey.startsWith('sb_publishable_');

export const getJourneySupabaseConfigDiagnostics = () => ({
  provider: configuredProvider ?? 'local',
  hasUrl: Boolean(supabaseUrl),
  hasAnonKey: Boolean(supabaseAnonKey),
  validUrl: hasValidSupabaseUrl(),
  publishableKeyFormat: hasPublishableAnonKey(),
});

const warnAboutMalformedConfig = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const diagnostics = getJourneySupabaseConfigDiagnostics();
  const invalidReasons: string[] = [];

  if (!diagnostics.hasUrl) {
    invalidReasons.push('VITE_SUPABASE_URL is missing');
  } else if (!diagnostics.validUrl) {
    invalidReasons.push(
      'VITE_SUPABASE_URL must be the project root URL and must not include /rest/v1/'
    );
  }

  if (!diagnostics.hasAnonKey) {
    invalidReasons.push('VITE_SUPABASE_ANON_KEY is missing');
  } else if (!diagnostics.publishableKeyFormat) {
    invalidReasons.push('VITE_SUPABASE_ANON_KEY should be the publishable browser key');
  }

  if (invalidReasons.length > 0) {
    console.error(
      `[mvpJourney] Supabase provider configuration is invalid: ${invalidReasons.join('; ')}`
    );
  }
};

export const createJourneySupabaseClient = (): SupabaseClient | null => {
  const diagnostics = getJourneySupabaseConfigDiagnostics();
  const canCreateClient =
    diagnostics.hasUrl &&
    diagnostics.hasAnonKey &&
    diagnostics.validUrl &&
    diagnostics.publishableKeyFormat;

  if (!canCreateClient) {
    warnAboutMalformedConfig();
    return null;
  }

  return createClient(supabaseUrl as string, supabaseAnonKey as string);
};
