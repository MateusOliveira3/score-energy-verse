import { useState, useEffect } from 'react';
import { supabase, Invoice } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Buscar faturas do usuário
  const fetchInvoices = async () => {
    if (!user) return;

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
        title: "Erro",
        description: "Não foi possível carregar suas faturas.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Adicionar nova fatura
  const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para adicionar faturas.",
        variant: "destructive"
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          ...invoiceData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setInvoices(prev => [data, ...prev]);
      
      toast({
        title: "Fatura salva! ⚡",
        description: "Sua fatura foi processada e salva com sucesso.",
      });

      return data;
    } catch (error) {
      console.error('Erro ao salvar fatura:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a fatura. Tente novamente.",
        variant: "destructive"
      });
      return null;
    }
  };

  // Upload de arquivo para storage (opcional)
  const uploadFile = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('invoices')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Erro no upload do arquivo:', error);
      return null;
    }
  };

  // Deletar fatura
  const deleteInvoice = async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId));
      
      toast({
        title: "Fatura removida",
        description: "A fatura foi removida com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao deletar fatura:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a fatura.",
        variant: "destructive"
      });
    }
  };

  // Calcular estatísticas das faturas
  const getInvoiceStats = () => {
    if (invoices.length === 0) {
      return {
        totalConsumption: 0,
        averageConsumption: 0,
        totalValue: 0,
        averageValue: 0,
        totalInvoices: 0
      };
    }

    const totalConsumption = invoices.reduce((sum, invoice) => sum + invoice.consumption, 0);
    const totalValue = invoices.reduce((sum, invoice) => sum + invoice.total_value, 0);

    return {
      totalConsumption,
      averageConsumption: Math.round(totalConsumption / invoices.length),
      totalValue,
      averageValue: Math.round(totalValue / invoices.length),
      totalInvoices: invoices.length
    };
  };

  useEffect(() => {
    if (user) {
      fetchInvoices();
    }
  }, [user]);

  return {
    invoices,
    loading,
    addInvoice,
    deleteInvoice,
    uploadFile,
    getInvoiceStats,
    refreshInvoices: fetchInvoices
  };
}; 