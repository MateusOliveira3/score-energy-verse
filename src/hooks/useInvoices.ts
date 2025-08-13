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



  const extractInvoiceData = async (file: File) => {
    if (!user) throw new Error("Usuário não autenticado");
    // Retorna o resultado da API: { message, extractedData, fileName, economy, points, diagnostico }
    return await dataService.extractInvoiceData(file, user.id);
  };

  const latestInvoice = invoices.length > 0 ? invoices[0] : null;

  return { invoices, isLoading, extractInvoiceData, refreshInvoices: fetchInvoices, latestInvoice };
}; 