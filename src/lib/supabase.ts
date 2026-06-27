import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isLocalQaForcedRuntime } from '@/lib/localQaRuntime';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isLocalQaOverrideActive = isLocalQaForcedRuntime();

export const isSupabaseConfigured =
  !isLocalQaOverrideActive && Boolean(supabaseUrl && supabaseAnonKey);

// In local MVP development we allow the app to boot without Supabase so the
// guided flow can be tested safely. Runtime callers must branch on this flag.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export type UserProfile = {
  id: string;
  email: string;
  consumer_type: string;
  location: string;
  property_size: number;
  people_count: number;
  energy_preference: string;
  created_at: string;
  updated_at: string;
};

export type UserScore = {
  id: string;
  user_id: string;
  score: number;
  level: number;
  created_at: string;
  updated_at: string;
};

export type UserMascot = {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  color_palette: string;
  border_effect: string;
  created_at: string;
  updated_at: string;
};

export type Invoice = {
  id: string;
  user_id: string;
  consumption: number;
  total_value: number;
  tax_percentage: number;
  peak_hours: string;
  month: string;
  file_url?: string;
  file_name?: string;
  created_at: string;
  updated_at: string;
};
