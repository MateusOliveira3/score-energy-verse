import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import InvoiceHistory from '../components/InvoiceHistory';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const HistoricoPage = () => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-cyan-50">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Cabeçalho com botão de voltar */}
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="outline" 
              onClick={handleBackToHome}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Início
            </Button>
            <h1 className="text-3xl font-bold text-gray-800">Histórico Completo de Faturas</h1>
          </div>
          
          {/* Lista completa de faturas */}
          <InvoiceHistory />
        </div>
      </main>
    </div>
  );
};

export default HistoricoPage;
