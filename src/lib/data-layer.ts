// Interface de abstração para camada de dados
// Permite migração suave entre Supabase e Google Sheets

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  consumer_type: string;
  location: string;
  property_size: number;
  people_count: number;
  energy_preference: string;
  created_at: string;
  updated_at: string;
}

export interface UserScore {
  id: string;
  user_id: string;
  score: number;
  level: number;
  created_at: string;
  updated_at: string;
}

export interface UserMascot {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  color_palette: string;
  border_effect: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  month: string;
  consumption: number | string;
  total_value: number | string;
  tax_percentage: number | string;
  peak_hours: string | number;
  file_url?: string;
  file_name?: string;
  created_at: string;
  points_earned: number;
  reactive_energy_kvarh?: string;
  has_fine?: string;
  due_date?: string;
}

export interface GamificationData {
  id: string;
  user_id: string;
  coins: number;
  achievements: string[];
  completed_missions: string[];
  current_streak: number;
  total_points: number;
  created_at: string;
  updated_at: string;
}

// Interface principal da camada de dados
export interface DataLayer {
  // Autenticação
  signIn(email: string, password: string): Promise<User>;
  signUp(email: string, password: string): Promise<User>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  
  // Perfis de usuário
  getUserProfile(userId: string): Promise<UserProfile | null>;
  createUserProfile(data: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<UserProfile>;
  updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void>;
  
  // Scores e níveis
  getUserScore(userId: string): Promise<UserScore | null>;
  createUserScore(data: Omit<UserScore, 'id' | 'created_at' | 'updated_at'>): Promise<UserScore>;
  updateUserScore(userId: string, score: number, level: number): Promise<void>;
  
  // Mascotes
  getUserMascot(userId: string): Promise<UserMascot | null>;
  createUserMascot(data: Omit<UserMascot, 'id' | 'created_at' | 'updated_at'>): Promise<UserMascot>;
  updateUserMascot(userId: string, data: Partial<UserMascot>): Promise<void>;
  
  // Faturas
  getInvoices(userId: string): Promise<Invoice[]>;
  getInvoice(invoiceId: string): Promise<Invoice | null>;
  createInvoice(data: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>): Promise<Invoice>;
  updateInvoice(invoiceId: string, data: Partial<Invoice>): Promise<void>;
  deleteInvoice(invoiceId: string): Promise<void>;
  
  // Upload de arquivos
  uploadFile(file: File, userId: string): Promise<string>;
  
  // Gamificação
  getGamificationData(userId: string): Promise<GamificationData | null>;
  createGamificationData(data: Omit<GamificationData, 'id' | 'created_at' | 'updated_at'>): Promise<GamificationData>;
  updateGamificationData(userId: string, data: Partial<GamificationData>): Promise<void>;
  
  // Leaderboard
  getLeaderboard(): Promise<Array<{ user_id: string; email: string; score: number; level: number }>>;
} 