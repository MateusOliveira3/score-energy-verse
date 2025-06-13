import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function SupabaseTest() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<{
    url: string;
    key: string;
  }>({
    url: import.meta.env.VITE_SUPABASE_URL || 'Não configurada',
    key: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configurada' : 'Não configurada'
  });

  useEffect(() => {
    async function testConnection() {
      try {
        // Teste simples de conexão usando auth.getSession()
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        setStatus('success');
        setError(null);
      } catch (err: any) {
        setStatus('error');
        setError(JSON.stringify({
          message: err.message,
          details: err.details,
          hint: err.hint,
          code: err.code
        }, null, 2));
      }
    }

    testConnection();
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Teste de Conexão Supabase</h2>
      
      <div className="mb-4">
        <p className="font-semibold">Status: {status === 'loading' ? '🔄 Testando...' : 
          status === 'success' ? '✅ Conectado' : '❌ Erro'}</p>
      </div>

      <div className="mb-4">
        <p>URL: {connectionInfo.url ? '✅ Configurada' : '❌ Não configurada'}</p>
        <p>Key: {connectionInfo.key ? '✅ Configurada' : '❌ Não configurada'}</p>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 rounded-md">
          <p className="text-red-600 font-semibold">Erro:</p>
          <pre className="mt-2 text-sm text-red-500 whitespace-pre-wrap">{error}</pre>
        </div>
      )}

      {status === 'success' && (
        <div className="mt-4 p-4 bg-green-50 rounded-md">
          <p className="text-green-600">✅ Conexão estabelecida com sucesso!</p>
        </div>
      )}
    </div>
  );
} 