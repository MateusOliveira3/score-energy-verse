import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const SupabaseTest = () => {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testando...');
  const [tableStatus, setTableStatus] = useState<string>('Testando...');
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      // Teste de conexão básica
      const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
      
      if (error) {
        setConnectionStatus('❌ Erro na conexão: ' + error.message);
      } else {
        setConnectionStatus('✅ Conexão OK');
      }
    } catch (error) {
      setConnectionStatus('❌ Erro: ' + (error as Error).message);
    }
  };

  const testInvoicesTable = async () => {
    setIsLoading(true);
    setTableStatus('Testando...');
    
    try {
      // Teste se a tabela invoices existe
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .limit(1);

      if (error) {
        if (error.message.includes('relation "invoices" does not exist')) {
          setTableStatus('❌ Tabela invoices não existe! Execute o script SQL primeiro.');
        } else {
          setTableStatus('❌ Erro na tabela: ' + error.message);
        }
      } else {
        setTableStatus('✅ Tabela invoices OK');
      }
    } catch (error) {
      setTableStatus('❌ Erro: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const testInsertInvoice = async () => {
    if (!user) {
      setTestResult('❌ Usuário não autenticado');
      return;
    }

    setIsLoading(true);
    setTestResult('Inserindo fatura de teste...');

    try {
      const testInvoice = {
        user_id: user.id,
        consumption: 250.5,
        total_value: 180.75,
        tax_percentage: 25.5,
        peak_hours: '18:00-22:00',
        month: 'Janeiro 2024',
        file_name: 'teste.pdf'
      };

      const { data, error } = await supabase
        .from('invoices')
        .insert(testInvoice)
        .select()
        .single();

      if (error) {
        setTestResult('❌ Erro ao inserir: ' + error.message);
      } else {
        setTestResult('✅ Fatura inserida com sucesso! ID: ' + data.id);
      }
    } catch (error) {
      setTestResult('❌ Erro: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const testSelectInvoices = async () => {
    if (!user) {
      setTestResult('❌ Usuário não autenticado');
      return;
    }

    setIsLoading(true);
    setTestResult('Buscando faturas...');

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        setTestResult('❌ Erro ao buscar: ' + error.message);
      } else {
        setTestResult(`✅ Encontradas ${data?.length || 0} faturas`);
        if (data && data.length > 0) {
          console.log('Faturas encontradas:', data);
        }
      }
    } catch (error) {
      setTestResult('❌ Erro: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Teste do Supabase - Faturas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Conexão</h3>
            <p className="text-sm">{connectionStatus}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Tabela Invoices</h3>
            <p className="text-sm">{tableStatus}</p>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Usuário Atual</h3>
          <p className="text-sm">
            {user ? `✅ Logado: ${user.email} (ID: ${user.id})` : '❌ Não logado'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={testInvoicesTable}
            disabled={isLoading}
            variant="outline"
          >
            Testar Tabela
          </Button>
          <Button 
            onClick={testInsertInvoice}
            disabled={isLoading || !user}
            variant="outline"
          >
            Inserir Teste
          </Button>
          <Button 
            onClick={testSelectInvoices}
            disabled={isLoading || !user}
            variant="outline"
          >
            Buscar Faturas
          </Button>
        </div>

        {testResult && (
          <div className="p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold mb-2">Resultado do Teste</h3>
            <p className="text-sm whitespace-pre-wrap">{testResult}</p>
          </div>
        )}

        <div className="p-4 border rounded-lg bg-yellow-50">
          <h3 className="font-semibold mb-2 text-yellow-800">Instruções</h3>
          <ol className="text-sm text-yellow-700 space-y-1">
            <li>1. Execute o script SQL no Supabase Dashboard</li>
            <li>2. Clique em "Testar Tabela" para verificar se existe</li>
            <li>3. Faça login na aplicação</li>
            <li>4. Teste inserir e buscar faturas</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupabaseTest; 