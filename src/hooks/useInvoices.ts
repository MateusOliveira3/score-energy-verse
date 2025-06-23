import { useState, useEffect, useCallback } from 'react';
import { Invoice } from '@/lib/data-layer';
import * as dataService from '@/lib/data-service';
import { useAuth } from '@/contexts/AuthContext';

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchInvoices = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const userInvoices = await dataService.getInvoices(user.id);
      setInvoices(userInvoices);
    } catch (error) {
      console.error("Erro ao buscar faturas:", error);
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchInvoices();
    } else {
      // Limpa as faturas se o usuário fizer logout
      setInvoices([]);
      setIsLoading(false);
    }
  }, [user, fetchInvoices]);

  const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'created_at' | 'points_earned' | 'user_id'>) => {
    if (!user) throw new Error("Usuário não autenticado");

    const fullInvoiceData = {
      ...invoiceData,
      user_id: user.id,
    };
    
    await dataService.addInvoice(fullInvoiceData);
    
    // Atualizar a lista localmente para refletir a nova fatura instantaneamente
    const newInvoice: Invoice = {
      ...fullInvoiceData,
      id: new Date().getTime().toString(), // ID temporário para UI
      created_at: new Date().toISOString(),
      points_earned: 100, // Valor de exemplo
    };
    setInvoices(prev => [newInvoice, ...prev]);
  };

  const uploadFile = async (file: File) => {
    if (!user) throw new Error("Usuário não autenticado");
    // Retorna o resultado da API: { message, fileUrl, fileName, fileId }
    return await dataService.uploadFile(file, user.id);
  };

  const latestInvoice = invoices.length > 0 ? invoices[0] : null;

  return { invoices, isLoading, addInvoice, uploadFile, refreshInvoices: fetchInvoices, latestInvoice };
}; 