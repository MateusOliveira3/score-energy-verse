import { google } from 'googleapis';
import { DataLayer, User, UserProfile, UserScore, UserMascot, Invoice, GamificationData } from './data-layer';
import { localAuth } from './local-auth';

// Configuração do Google Sheets
const SPREADSHEET_ID = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID || 'your-spreadsheet-id';
const SERVICE_ACCOUNT_EMAIL = import.meta.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL || 'your-service-account@project.iam.gserviceaccount.com';
const PRIVATE_KEY = import.meta.env.VITE_GOOGLE_PRIVATE_KEY || 'your-private-key';

// IDs das abas (sheets) no Google Sheets
const SHEETS = {
  USERS: 'users',
  USER_PROFILES: 'user_profiles',
  USER_SCORES: 'user_scores',
  USER_MASCOTS: 'user_mascots',
  INVOICES: 'invoices',
  GAMIFICATION: 'gamification'
};

class GoogleSheetsAdapter implements DataLayer {
  private sheets: any;
  private cache: Map<string, any> = new Map();
  private auth: any;

  constructor() {
    // A inicialização agora será feita no backend
  }
  
  // Métodos de autenticação (usando localAuth)
  async signIn(email: string, password: string): Promise<User> {
    // Esta lógica agora viverá no backend.
    // O frontend chamará uma API.
    return localAuth.signIn(email, password);
  }

  async signUp(email: string, password: string): Promise<User> {
    const user = await localAuth.signUp(email, password);
    // A criação de dados no sheets será feita pelo backend
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

  // Métodos auxiliares para Google Sheets
  private async readSheet(sheetName: string): Promise<any[][]> {
    const cacheKey = `sheet_${sheetName}`;
    
    // Verificar cache primeiro
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: sheetName,
      });

      const values = response.data.values || [];
      
      // Cache por 5 minutos
      this.cache.set(cacheKey, values);
      setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000);

      return values;
    } catch (error) {
      console.error(`Erro ao ler planilha ${sheetName}:`, error);
      return [];
    }
  }

  private async writeSheet(sheetName: string, values: any[][]): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: sheetName,
        valueInputOption: 'RAW',
        resource: { values },
      });

      // Limpar cache
      this.cache.delete(`sheet_${sheetName}`);
    } catch (error) {
      console.error(`Erro ao escrever na planilha ${sheetName}:`, error);
    }
  }

  private async appendToSheet(sheetName: string, values: any[]): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: sheetName,
        valueInputOption: 'RAW',
        resource: { values: [values] },
      });

      // Limpar cache
      this.cache.delete(`sheet_${sheetName}`);
    } catch (error) {
      console.error(`Erro ao adicionar na planilha ${sheetName}:`, error);
    }
  }

  // Perfis de usuário
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const rows = await this.readSheet(SHEETS.USER_PROFILES);
    const headers = rows[0];
    const dataRows = rows.slice(1);

    const profileRow = dataRows.find(row => row[1] === userId);
    if (!profileRow) return null;

    return this.rowToUserProfile(profileRow, headers);
  }

  async createUserProfile(data: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<UserProfile> {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    const profile: UserProfile = {
      id,
      ...data,
      created_at: now,
      updated_at: now
    };

    const values = [
      profile.id,
      profile.user_id,
      profile.email,
      profile.consumer_type,
      profile.location,
      profile.property_size,
      profile.people_count,
      profile.energy_preference,
      profile.created_at,
      profile.updated_at
    ];

    await this.appendToSheet(SHEETS.USER_PROFILES, values);
    return profile;
  }

  async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    const rows = await this.readSheet(SHEETS.USER_PROFILES);
    const headers = rows[0];
    const dataRows = rows.slice(1);

    const rowIndex = dataRows.findIndex(row => row[1] === userId);
    if (rowIndex === -1) throw new Error('Perfil não encontrado');

    const updatedRow = [...dataRows[rowIndex]];
    const updatedAt = new Date().toISOString();

    Object.keys(data).forEach(key => {
      const colIndex = headers.indexOf(key);
      if (colIndex !== -1) {
        updatedRow[colIndex] = (data as any)[key];
      }
    });

    updatedRow[headers.indexOf('updated_at')] = updatedAt;
    dataRows[rowIndex] = updatedRow;

    await this.writeSheet(SHEETS.USER_PROFILES, [headers, ...dataRows]);
  }

  // Scores e níveis
  async getUserScore(userId: string): Promise<UserScore | null> {
    const rows = await this.readSheet(SHEETS.USER_SCORES);
    const headers = rows[0];
    const dataRows = rows.slice(1);

    const scoreRow = dataRows.find(row => row[1] === userId);
    if (!scoreRow) return null;

    return this.rowToUserScore(scoreRow, headers);
  }

  async createUserScore(data: Omit<UserScore, 'id' | 'created_at' | 'updated_at'>): Promise<UserScore> {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    const score: UserScore = {
      id,
      ...data,
      created_at: now,
      updated_at: now
    };

    const values = [
      score.id,
      score.user_id,
      score.score,
      score.level,
      score.created_at,
      score.updated_at
    ];

    await this.appendToSheet(SHEETS.USER_SCORES, values);
    return score;
  }

  async updateUserScore(userId: string, score: number, level: number): Promise<void> {
    const rows = await this.readSheet(SHEETS.USER_SCORES);
    const headers = rows[0];
    const dataRows = rows.slice(1);

    const rowIndex = dataRows.findIndex(row => row[1] === userId);
    if (rowIndex === -1) throw new Error('Score não encontrado');

    const updatedRow = [...dataRows[rowIndex]];
    updatedRow[headers.indexOf('score')] = score;
    updatedRow[headers.indexOf('level')] = level;
    updatedRow[headers.indexOf('updated_at')] = new Date().toISOString();

    dataRows[rowIndex] = updatedRow;
    await this.writeSheet(SHEETS.USER_SCORES, [headers, ...dataRows]);
  }

  // Mascotes
  async getUserMascot(userId: string): Promise<UserMascot | null> {
    const rows = await this.readSheet(SHEETS.USER_MASCOTS);
    const headers = rows[0];
    const dataRows = rows.slice(1);

    const mascotRow = dataRows.find(row => row[1] === userId);
    if (!mascotRow) return null;

    return this.rowToUserMascot(mascotRow, headers);
  }

  async createUserMascot(data: Omit<UserMascot, 'id' | 'created_at' | 'updated_at'>): Promise<UserMascot> {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    const mascot: UserMascot = {
      id,
      ...data,
      created_at: now,
      updated_at: now
    };

    const values = [
      mascot.id,
      mascot.user_id,
      mascot.name,
      mascot.emoji,
      mascot.color_palette,
      mascot.border_effect,
      mascot.created_at,
      mascot.updated_at
    ];

    await this.appendToSheet(SHEETS.USER_MASCOTS, values);
    return mascot;
  }

  async updateUserMascot(userId: string, data: Partial<UserMascot>): Promise<void> {
    const rows = await this.readSheet(SHEETS.USER_MASCOTS);
    const headers = rows[0];
    const dataRows = rows.slice(1);

    const rowIndex = dataRows.findIndex(row => row[1] === userId);
    if (rowIndex === -1) throw new Error('Mascote não encontrado');

    const updatedRow = [...dataRows[rowIndex]];
    const updatedAt = new Date().toISOString();

    Object.keys(data).forEach(key => {
      const colIndex = headers.indexOf(key);
      if (colIndex !== -1) {
        updatedRow[colIndex] = (data as any)[key];
      }
    });

    updatedRow[headers.indexOf('updated_at')] = updatedAt;
    dataRows[rowIndex] = updatedRow;

    await this.writeSheet(SHEETS.USER_MASCOTS, [headers, ...dataRows]);
  }

  // Faturas
  async getInvoices(userId: string): Promise<Invoice[]> {
    const rows = await this.readSheet(SHEETS.INVOICES);
    const headers = rows[0];
    const dataRows = rows.slice(1);

    const userInvoices = dataRows.filter(row => row[1] === userId);
    return userInvoices.map(row => this.rowToInvoice(row, headers));
  }

  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    const rows = await this.readSheet(SHEETS.INVOICES);
    const headers = rows[0];
    const dataRows = rows.slice(1);

    const invoiceRow = dataRows.find(row => row[0] === invoiceId);
    if (!invoiceRow) return null;

    return this.rowToInvoice(invoiceRow, headers);
  }

  async createInvoice(data: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>): Promise<Invoice> {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    const invoice: Invoice = {
      id,
      ...data,
      created_at: now,
      updated_at: now
    };

    const values = [
      invoice.id,
      invoice.user_id,
      invoice.consumption,
      invoice.total_value,
      invoice.tax_percentage,
      invoice.peak_hours,
      invoice.month,
      invoice.file_url || '',
      invoice.file_name || '',
      invoice.created_at,
      invoice.updated_at
    ];

    await this.appendToSheet(SHEETS.INVOICES, values);
    return invoice;
  }

  async updateInvoice(invoiceId: string, data: Partial<Invoice>): Promise<void> {
    const rows = await this.readSheet(SHEETS.INVOICES);
    const headers = rows[0];
    const dataRows = rows.slice(1);

    const rowIndex = dataRows.findIndex(row => row[0] === invoiceId);
    if (rowIndex === -1) throw new Error('Fatura não encontrada');

    const updatedRow = [...dataRows[rowIndex]];
    const updatedAt = new Date().toISOString();

    Object.keys(data).forEach(key => {
      const colIndex = headers.indexOf(key);
      if (colIndex !== -1) {
        updatedRow[colIndex] = (data as any)[key];
      }
    });

    updatedRow[headers.indexOf('updated_at')] = updatedAt;
    dataRows[rowIndex] = updatedRow;

    await this.writeSheet(SHEETS.INVOICES, [headers, ...dataRows]);
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    const rows = await this.readSheet(SHEETS.INVOICES);
    const headers = rows[0];
    const dataRows = rows.slice(1);

    const filteredRows = dataRows.filter(row => row[0] !== invoiceId);
    await this.writeSheet(SHEETS.INVOICES, [headers, ...filteredRows]);
  }

  // Upload de arquivos (será implementado com Google Drive)
  async uploadFile(file: File, userId: string): Promise<string> {
    // Este método será implementado pelo GoogleDriveAdapter
    console.log('Upload será feito pelo GoogleDriveAdapter');
    return `https://drive.google.com/file/d/simulated-${userId}/${Date.now()}-${file.name}`;
  }

  // Gamificação
  async getGamificationData(userId: string): Promise<GamificationData | null> {
    const rows = await this.readSheet(SHEETS.GAMIFICATION);
    const headers = rows[0];
    const dataRows = rows.slice(1);

    const gamificationRow = dataRows.find(row => row[1] === userId);
    if (!gamificationRow) return null;

    return this.rowToGamificationData(gamificationRow, headers);
  }

  async createGamificationData(data: Omit<GamificationData, 'id' | 'created_at' | 'updated_at'>): Promise<GamificationData> {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    const gamification: GamificationData = {
      id,
      ...data,
      created_at: now,
      updated_at: now
    };

    const values = [
      gamification.id,
      gamification.user_id,
      gamification.coins,
      JSON.stringify(gamification.achievements),
      JSON.stringify(gamification.completed_missions),
      gamification.current_streak,
      gamification.total_points,
      gamification.created_at,
      gamification.updated_at
    ];

    await this.appendToSheet(SHEETS.GAMIFICATION, values);
    return gamification;
  }

  async updateGamificationData(userId: string, data: Partial<GamificationData>): Promise<void> {
    const rows = await this.readSheet(SHEETS.GAMIFICATION);
    const headers = rows[0];
    const dataRows = rows.slice(1);

    const rowIndex = dataRows.findIndex(row => row[1] === userId);
    if (rowIndex === -1) throw new Error('Dados de gamificação não encontrados');

    const updatedRow = [...dataRows[rowIndex]];
    const updatedAt = new Date().toISOString();

    Object.keys(data).forEach(key => {
      const colIndex = headers.indexOf(key);
      if (colIndex !== -1) {
        const value = (data as any)[key];
        updatedRow[colIndex] = Array.isArray(value) ? JSON.stringify(value) : value;
      }
    });

    updatedRow[headers.indexOf('updated_at')] = updatedAt;
    dataRows[rowIndex] = updatedRow;

    await this.writeSheet(SHEETS.GAMIFICATION, [headers, ...dataRows]);
  }

  // Leaderboard
  async getLeaderboard(): Promise<Array<{ user_id: string; email: string; score: number; level: number }>> {
    const scores = await this.readSheet(SHEETS.USER_SCORES);
    const profiles = await this.readSheet(SHEETS.USER_PROFILES);
    
    const scoreHeaders = scores[0];
    const scoreData = scores.slice(1);
    const profileHeaders = profiles[0];
    const profileData = profiles.slice(1);

    const leaderboard = scoreData.map(scoreRow => {
      const userId = scoreRow[scoreHeaders.indexOf('user_id')];
      const score = parseInt(scoreRow[scoreHeaders.indexOf('score')]);
      const level = parseInt(scoreRow[scoreHeaders.indexOf('level')]);
      
      const profileRow = profileData.find(p => p[profileHeaders.indexOf('user_id')] === userId);
      const email = profileRow ? profileRow[profileHeaders.indexOf('email')] : '';

      return { user_id: userId, email, score, level };
    });

    return leaderboard.sort((a, b) => b.score - a.score);
  }

  // Métodos auxiliares para conversão de dados
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private rowToUserProfile(row: any[], headers: string[]): UserProfile {
    return {
      id: row[headers.indexOf('id')],
      user_id: row[headers.indexOf('user_id')],
      email: row[headers.indexOf('email')],
      consumer_type: row[headers.indexOf('consumer_type')],
      location: row[headers.indexOf('location')],
      property_size: parseInt(row[headers.indexOf('property_size')]),
      people_count: parseInt(row[headers.indexOf('people_count')]),
      energy_preference: row[headers.indexOf('energy_preference')],
      created_at: row[headers.indexOf('created_at')],
      updated_at: row[headers.indexOf('updated_at')]
    };
  }

  private rowToUserScore(row: any[], headers: string[]): UserScore {
    return {
      id: row[headers.indexOf('id')],
      user_id: row[headers.indexOf('user_id')],
      score: parseInt(row[headers.indexOf('score')]),
      level: parseInt(row[headers.indexOf('level')]),
      created_at: row[headers.indexOf('created_at')],
      updated_at: row[headers.indexOf('updated_at')]
    };
  }

  private rowToUserMascot(row: any[], headers: string[]): UserMascot {
    return {
      id: row[headers.indexOf('id')],
      user_id: row[headers.indexOf('user_id')],
      name: row[headers.indexOf('name')],
      emoji: row[headers.indexOf('emoji')],
      color_palette: row[headers.indexOf('color_palette')],
      border_effect: row[headers.indexOf('border_effect')],
      created_at: row[headers.indexOf('created_at')],
      updated_at: row[headers.indexOf('updated_at')]
    };
  }

  private rowToInvoice(row: any[], headers: string[]): Invoice {
    return {
      id: row[headers.indexOf('id')],
      user_id: row[headers.indexOf('user_id')],
      consumption: parseFloat(row[headers.indexOf('consumption')]),
      total_value: parseFloat(row[headers.indexOf('total_value')]),
      tax_percentage: parseFloat(row[headers.indexOf('tax_percentage')]),
      peak_hours: row[headers.indexOf('peak_hours')],
      month: row[headers.indexOf('month')],
      file_url: row[headers.indexOf('file_url')] || undefined,
      file_name: row[headers.indexOf('file_name')] || undefined,
      created_at: row[headers.indexOf('created_at')],
      updated_at: row[headers.indexOf('updated_at')]
    };
  }

  private rowToGamificationData(row: any[], headers: string[]): GamificationData {
    return {
      id: row[headers.indexOf('id')],
      user_id: row[headers.indexOf('user_id')],
      coins: parseInt(row[headers.indexOf('coins')]),
      achievements: JSON.parse(row[headers.indexOf('achievements')] || '[]'),
      completed_missions: JSON.parse(row[headers.indexOf('completed_missions')] || '[]'),
      current_streak: parseInt(row[headers.indexOf('current_streak')]),
      total_points: parseInt(row[headers.indexOf('total_points')]),
      created_at: row[headers.indexOf('created_at')],
      updated_at: row[headers.indexOf('updated_at')]
    };
  }
}

export const googleSheetsAdapter = new GoogleSheetsAdapter(); 