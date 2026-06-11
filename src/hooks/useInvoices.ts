import { useState, useEffect } from 'react';
import { isSupabaseConfigured, supabase, Invoice } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const getLocalInvoiceStorageKey = (userId: string) => `score-energy-local-invoices:${userId}`;

const readLocalInvoices = (userId: string) => {
  if (typeof window === 'undefined') {
    return [] as Invoice[];
  }

  const raw = window.localStorage.getItem(getLocalInvoiceStorageKey(userId));
  return raw ? (JSON.parse(raw) as Invoice[]) : [];
};

const writeLocalInvoices = (userId: string, invoices: Invoice[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(getLocalInvoiceStorageKey(userId), JSON.stringify(invoices));
};

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchInvoices = async () => {
    if (!user) {
      setInvoices([]);
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setInvoices(readLocalInvoices(user.id));
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Erro ao buscar faturas:', error);
      toast({
        title: 'Erro',
        description: 'Nao foi possivel carregar suas faturas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addInvoice = async (
    invoiceData: Omit<Invoice, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Voce precisa estar logado para adicionar faturas.',
        variant: 'destructive',
      });
      return null;
    }

    if (!isSupabaseConfigured || !supabase) {
      const now = new Date().toISOString();
      const localInvoice: Invoice = {
        id:
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `local-invoice-${Date.now()}`,
        user_id: user.id,
        created_at: now,
        updated_at: now,
        ...invoiceData,
      };

      const nextInvoices = [localInvoice, ...readLocalInvoices(user.id)];
      writeLocalInvoices(user.id, nextInvoices);
      setInvoices(nextInvoices);

      toast({
        title: 'Fatura salva localmente',
        description: 'Modo local ativo: a fatura foi guardada no navegador para testes do MVP.',
      });

      return localInvoice;
    }

    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          ...invoiceData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setInvoices((prev) => [data, ...prev]);

      toast({
        title: 'Fatura salva! ⚡',
        description: 'Sua fatura foi processada e salva com sucesso.',
      });

      return data;
    } catch (error) {
      console.error('Erro ao salvar fatura:', error);
      toast({
        title: 'Erro',
        description: 'Nao foi possivel salvar a fatura. Tente novamente.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!user || !isSupabaseConfigured || !supabase) return null;

    try {
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('invoices').upload(fileName, file);

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from('invoices').getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Erro no upload do arquivo:', error);
      return null;
    }
  };

  const deleteInvoice = async (invoiceId: string) => {
    if (!user) {
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      const nextInvoices = readLocalInvoices(user.id).filter((invoice) => invoice.id !== invoiceId);
      writeLocalInvoices(user.id, nextInvoices);
      setInvoices(nextInvoices);

      toast({
        title: 'Fatura removida',
        description: 'A fatura foi removida do armazenamento local.',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId)
        .eq('user_id', user.id);

      if (error) throw error;

      setInvoices((prev) => prev.filter((invoice) => invoice.id !== invoiceId));

      toast({
        title: 'Fatura removida',
        description: 'A fatura foi removida com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao deletar fatura:', error);
      toast({
        title: 'Erro',
        description: 'Nao foi possivel remover a fatura.',
        variant: 'destructive',
      });
    }
  };

  const getInvoiceStats = () => {
    if (invoices.length === 0) {
      return {
        totalConsumption: 0,
        averageConsumption: 0,
        totalValue: 0,
        averageValue: 0,
        totalInvoices: 0,
      };
    }

    const totalConsumption = invoices.reduce((sum, invoice) => sum + invoice.consumption, 0);
    const totalValue = invoices.reduce((sum, invoice) => sum + invoice.total_value, 0);

    return {
      totalConsumption,
      averageConsumption: Math.round(totalConsumption / invoices.length),
      totalValue,
      averageValue: Math.round(totalValue / invoices.length),
      totalInvoices: invoices.length,
    };
  };

  useEffect(() => {
    if (user) {
      fetchInvoices();
    } else {
      setInvoices([]);
    }
  }, [user]);

  return {
    invoices,
    loading,
    addInvoice,
    deleteInvoice,
    uploadFile,
    getInvoiceStats,
    refreshInvoices: fetchInvoices,
  };
};
