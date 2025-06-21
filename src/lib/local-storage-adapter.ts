import { DataLayer, User, UserProfile, UserScore, UserMascot, Invoice, GamificationData } from './data-layer';
import { localAuth } from './local-auth';

// Adaptador de fallback usando localStorage
class LocalStorageAdapter implements DataLayer {
  private readonly STORAGE_KEYS = {
    USER_PROFILES: 'score_energy_user_profiles',
    USER_SCORES: 'score_energy_user_scores',
    USER_MASCOTS: 'score_energy_user_mascots',
    INVOICES: 'score_energy_invoices',
    GAMIFICATION: 'score_energy_gamification'
  };

  // Métodos de autenticação (usando localAuth)
  async signIn(email: string, password: string): Promise<User> {
    return localAuth.signIn(email, password);
  }

  async signUp(email: string, password: string): Promise<User> {
    const user = await localAuth.signUp(email, password);
    
    // Criar perfil inicial
    await this.createUserProfile({
      user_id: user.id,
      email: user.email,
      consumer_type: 'Residencial',
      location: '',
      property_size: 0,
      people_count: 1,
      energy_preference: 'Convencional'
    });

    // Criar score inicial
    await this.createUserScore({
      user_id: user.id,
      score: 0,
      level: 1
    });

    // Criar mascote inicial
    await this.createUserMascot({
      user_id: user.id,
      name: 'EcoFriend',
      emoji: '🌱',
      color_palette: 'emerald',
      border_effect: 'none'
    });

    // Criar dados de gamificação inicial
    await this.createGamificationData({
      user_id: user.id,
      coins: 0,
      achievements: [],
      completed_missions: [],
      current_streak: 0,
      total_points: 0
    });

    return user;
  }

  async signOut(): Promise<void> {
    return localAuth.signOut();
  }

  async resetPassword(email: string): Promise<void> {
    return localAuth.resetPassword(email);
  }

  async getCurrentUser(): Promise<User | null> {
    return localAuth.getCurrentUser();
  }

  // Métodos auxiliares para localStorage
  private getData<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private setData<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Perfis de usuário
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const profiles = this.getData<UserProfile>(this.STORAGE_KEYS.USER_PROFILES);
    return profiles.find(p => p.user_id === userId) || null;
  }

  async createUserProfile(data: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<UserProfile> {
    const profiles = this.getData<UserProfile>(this.STORAGE_KEYS.USER_PROFILES);
    const now = new Date().toISOString();
    
    const profile: UserProfile = {
      id: this.generateId(),
      ...data,
      created_at: now,
      updated_at: now
    };

    profiles.push(profile);
    this.setData(this.STORAGE_KEYS.USER_PROFILES, profiles);
    return profile;
  }

  async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    const profiles = this.getData<UserProfile>(this.STORAGE_KEYS.USER_PROFILES);
    const index = profiles.findIndex(p => p.user_id === userId);
    
    if (index === -1) throw new Error('Perfil não encontrado');

    profiles[index] = {
      ...profiles[index],
      ...data,
      updated_at: new Date().toISOString()
    };

    this.setData(this.STORAGE_KEYS.USER_PROFILES, profiles);
  }

  // Scores e níveis
  async getUserScore(userId: string): Promise<UserScore | null> {
    const scores = this.getData<UserScore>(this.STORAGE_KEYS.USER_SCORES);
    return scores.find(s => s.user_id === userId) || null;
  }

  async createUserScore(data: Omit<UserScore, 'id' | 'created_at' | 'updated_at'>): Promise<UserScore> {
    const scores = this.getData<UserScore>(this.STORAGE_KEYS.USER_SCORES);
    const now = new Date().toISOString();
    
    const score: UserScore = {
      id: this.generateId(),
      ...data,
      created_at: now,
      updated_at: now
    };

    scores.push(score);
    this.setData(this.STORAGE_KEYS.USER_SCORES, scores);
    return score;
  }

  async updateUserScore(userId: string, score: number, level: number): Promise<void> {
    const scores = this.getData<UserScore>(this.STORAGE_KEYS.USER_SCORES);
    const index = scores.findIndex(s => s.user_id === userId);
    
    if (index === -1) throw new Error('Score não encontrado');

    scores[index] = {
      ...scores[index],
      score,
      level,
      updated_at: new Date().toISOString()
    };

    this.setData(this.STORAGE_KEYS.USER_SCORES, scores);
  }

  // Mascotes
  async getUserMascot(userId: string): Promise<UserMascot | null> {
    const mascots = this.getData<UserMascot>(this.STORAGE_KEYS.USER_MASCOTS);
    return mascots.find(m => m.user_id === userId) || null;
  }

  async createUserMascot(data: Omit<UserMascot, 'id' | 'created_at' | 'updated_at'>): Promise<UserMascot> {
    const mascots = this.getData<UserMascot>(this.STORAGE_KEYS.USER_MASCOTS);
    const now = new Date().toISOString();
    
    const mascot: UserMascot = {
      id: this.generateId(),
      ...data,
      created_at: now,
      updated_at: now
    };

    mascots.push(mascot);
    this.setData(this.STORAGE_KEYS.USER_MASCOTS, mascots);
    return mascot;
  }

  async updateUserMascot(userId: string, data: Partial<UserMascot>): Promise<void> {
    const mascots = this.getData<UserMascot>(this.STORAGE_KEYS.USER_MASCOTS);
    const index = mascots.findIndex(m => m.user_id === userId);
    
    if (index === -1) throw new Error('Mascote não encontrado');

    mascots[index] = {
      ...mascots[index],
      ...data,
      updated_at: new Date().toISOString()
    };

    this.setData(this.STORAGE_KEYS.USER_MASCOTS, mascots);
  }

  // Faturas
  async getInvoices(userId: string): Promise<Invoice[]> {
    const invoices = this.getData<Invoice>(this.STORAGE_KEYS.INVOICES);
    return invoices.filter(i => i.user_id === userId);
  }

  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    const invoices = this.getData<Invoice>(this.STORAGE_KEYS.INVOICES);
    return invoices.find(i => i.id === invoiceId) || null;
  }

  async createInvoice(data: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>): Promise<Invoice> {
    const invoices = this.getData<Invoice>(this.STORAGE_KEYS.INVOICES);
    const now = new Date().toISOString();
    
    const invoice: Invoice = {
      id: this.generateId(),
      ...data,
      created_at: now,
      updated_at: now
    };

    invoices.push(invoice);
    this.setData(this.STORAGE_KEYS.INVOICES, invoices);
    return invoice;
  }

  async updateInvoice(invoiceId: string, data: Partial<Invoice>): Promise<void> {
    const invoices = this.getData<Invoice>(this.STORAGE_KEYS.INVOICES);
    const index = invoices.findIndex(i => i.id === invoiceId);
    
    if (index === -1) throw new Error('Fatura não encontrada');

    invoices[index] = {
      ...invoices[index],
      ...data,
      updated_at: new Date().toISOString()
    };

    this.setData(this.STORAGE_KEYS.INVOICES, invoices);
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    const invoices = this.getData<Invoice>(this.STORAGE_KEYS.INVOICES);
    const filteredInvoices = invoices.filter(i => i.id !== invoiceId);
    this.setData(this.STORAGE_KEYS.INVOICES, filteredInvoices);
  }

  // Upload de arquivos (simulado)
  async uploadFile(file: File, userId: string): Promise<string> {
    // Simular upload
    const fileName = `${userId}/${Date.now()}-${file.name}`;
    console.log(`Arquivo simulado enviado: ${fileName}`);
    return `local://${fileName}`;
  }

  // Gamificação
  async getGamificationData(userId: string): Promise<GamificationData | null> {
    const gamificationData = this.getData<GamificationData>(this.STORAGE_KEYS.GAMIFICATION);
    return gamificationData.find(g => g.user_id === userId) || null;
  }

  async createGamificationData(data: Omit<GamificationData, 'id' | 'created_at' | 'updated_at'>): Promise<GamificationData> {
    const gamificationData = this.getData<GamificationData>(this.STORAGE_KEYS.GAMIFICATION);
    const now = new Date().toISOString();
    
    const gamification: GamificationData = {
      id: this.generateId(),
      ...data,
      created_at: now,
      updated_at: now
    };

    gamificationData.push(gamification);
    this.setData(this.STORAGE_KEYS.GAMIFICATION, gamificationData);
    return gamification;
  }

  async updateGamificationData(userId: string, data: Partial<GamificationData>): Promise<void> {
    const gamificationData = this.getData<GamificationData>(this.STORAGE_KEYS.GAMIFICATION);
    const index = gamificationData.findIndex(g => g.user_id === userId);
    
    if (index === -1) throw new Error('Dados de gamificação não encontrados');

    gamificationData[index] = {
      ...gamificationData[index],
      ...data,
      updated_at: new Date().toISOString()
    };

    this.setData(this.STORAGE_KEYS.GAMIFICATION, gamificationData);
  }

  // Leaderboard
  async getLeaderboard(): Promise<Array<{ user_id: string; email: string; score: number; level: number }>> {
    const scores = this.getData<UserScore>(this.STORAGE_KEYS.USER_SCORES);
    const profiles = this.getData<UserProfile>(this.STORAGE_KEYS.USER_PROFILES);

    const leaderboard = scores.map(score => {
      const profile = profiles.find(p => p.user_id === score.user_id);
      return {
        user_id: score.user_id,
        email: profile?.email || '',
        score: score.score,
        level: score.level
      };
    });

    return leaderboard.sort((a, b) => b.score - a.score);
  }
}

export const localStorageAdapter = new LocalStorageAdapter(); 