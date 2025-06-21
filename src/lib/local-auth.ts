import { User } from './data-layer';

// Sistema de autenticação local usando localStorage e JWT simples
class LocalAuth {
  private readonly STORAGE_KEY = 'score_energy_auth';
  private readonly USERS_KEY = 'score_energy_users';

  // Gerar ID único
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Hash simples de senha (em produção, usar bcrypt)
  private hashPassword(password: string): string {
    return btoa(password + 'salt'); // Base64 simples
  }

  // Verificar senha
  private verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }

  // Gerar token JWT simples
  private generateToken(userId: string): string {
    const payload = {
      userId,
      exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 dias
    };
    return btoa(JSON.stringify(payload));
  }

  // Verificar token
  private verifyToken(token: string): { userId: string; valid: boolean } {
    try {
      const payload = JSON.parse(atob(token));
      if (payload.exp < Date.now()) {
        return { userId: '', valid: false };
      }
      return { userId: payload.userId, valid: true };
    } catch {
      return { userId: '', valid: false };
    }
  }

  // Registrar novo usuário
  async signUp(email: string, password: string): Promise<User> {
    const users = this.getUsers();
    
    // Verificar se email já existe
    if (users.find(u => u.email === email)) {
      throw new Error('Email já está em uso');
    }

    const newUser: User = {
      id: this.generateId(),
      email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Salvar usuário com senha hasheada
    const userWithPassword = {
      ...newUser,
      password_hash: this.hashPassword(password)
    };

    users.push(userWithPassword);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));

    // Fazer login automático
    const token = this.generateToken(newUser.id);
    localStorage.setItem(this.STORAGE_KEY, token);

    return newUser;
  }

  // Fazer login
  async signIn(email: string, password: string): Promise<User> {
    const users = this.getUsers();
    const user = users.find(u => u.email === email);

    if (!user || !this.verifyPassword(password, user.password_hash)) {
      throw new Error('Email ou senha inválidos');
    }

    // Gerar token e salvar
    const token = this.generateToken(user.id);
    localStorage.setItem(this.STORAGE_KEY, token);

    return {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  }

  // Fazer logout
  async signOut(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Reset de senha (simulado)
  async resetPassword(email: string): Promise<void> {
    const users = this.getUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
      throw new Error('Email não encontrado');
    }

    // Em produção, enviar email com link de reset
    // Por enquanto, apenas simular
    console.log(`Reset de senha solicitado para: ${email}`);
  }

  // Obter usuário atual
  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem(this.STORAGE_KEY);
    if (!token) return null;

    const { userId, valid } = this.verifyToken(token);
    if (!valid) {
      localStorage.removeItem(this.STORAGE_KEY);
      return null;
    }

    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  }

  // Obter lista de usuários
  private getUsers(): Array<User & { password_hash: string }> {
    const usersJson = localStorage.getItem(this.USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  }

  // Verificar se está autenticado
  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.STORAGE_KEY);
    if (!token) return false;

    const { valid } = this.verifyToken(token);
    return valid;
  }

  // Obter ID do usuário atual
  getCurrentUserId(): string | null {
    const token = localStorage.getItem(this.STORAGE_KEY);
    if (!token) return null;

    const { userId, valid } = this.verifyToken(token);
    return valid ? userId : null;
  }
}

export const localAuth = new LocalAuth(); 