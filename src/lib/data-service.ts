import { User, Invoice, UserProfile } from './data-layer';
import { localAuth } from './local-auth';

const API_BASE_URL = 'http://localhost:3001/api';

// Funções de Serviço de Dados

export const getProfile = async (userId: string): Promise<UserProfile | null> => {
    console.log('[Data Service] Buscando perfil para o usuário:', userId);
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/profile`);
        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error('Erro ao buscar perfil');
        }
        return await response.json();
    } catch (error) {
        console.error("Erro ao buscar perfil via API:", error);
        throw error;
    }
};

export const getInvoices = async (userId: string): Promise<Invoice[]> => {
    console.log('[Data Service] Buscando faturas para o usuário:', userId);
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/invoices`);
        if (!response.ok) throw new Error('Erro ao buscar faturas');
        return await response.json();
    } catch (error) {
        console.error("Erro ao buscar faturas via API:", error);
        throw error;
    }
};

export const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'created_at' | 'points_earned'>) => {
    console.log('[Data Service] Adicionando fatura para o usuário:', invoiceData.user_id);
    try {
        const response = await fetch(`${API_BASE_URL}/invoices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invoiceData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao registrar fatura');
        }

        const result = await response.json();
        console.log('[Data Service] Fatura registrada com sucesso:', result);
        return result;
    } catch (error) {
        console.error("Erro ao registrar fatura via API:", error);
        throw error;
    }
};

export const extractInvoiceData = async (file: File, userId: string) => {
    console.log(`[Data Service] Extraindo dados do arquivo ${file.name} para o usuário ${userId}`);
    const formData = new FormData();
    formData.append('invoice', file);
    formData.append('userId', userId);

    try {
        const response = await fetch(`${API_BASE_URL}/invoices/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro na extração dos dados');
        }

        const result = await response.json();
        console.log('[Data Service] Dados extraídos com sucesso:', result);
        return result;
    } catch (error) {
        console.error("Erro ao extrair dados via API:", error);
        throw error;
    }
};

export const signOut = async () => {
    localAuth.signOut();
}; 