import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para as tabelas do Supabase
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