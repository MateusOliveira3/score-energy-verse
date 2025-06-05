
import React, { useState } from 'react';
import Header from '../components/Header';
import ScoreCard from '../components/ScoreCard';
import ActionCards from '../components/ActionCards';
import Leaderboard from '../components/Leaderboard';
import LevelProgress from '../components/LevelProgress';
import InvoiceUpload from '../components/InvoiceUpload';
import SmartRecommendations from '../components/SmartRecommendations';

interface InvoiceData {
  consumption: number;
  totalValue: number;
  taxPercentage: number;
  peakHours: string;
  month: string;
}

const Index = () => {
  const [invoiceData, setInvoiceData] = useState<InvoiceData | undefined>();
  const [currentScore, setCurrentScore] = useState(1247);
  const [currentLevel, setCurrentLevel] = useState(7);

  const handleInvoiceProcessed = (data: InvoiceData) => {
    setInvoiceData(data);
    // Simula o cálculo do score baseado nos dados da fatura
    const scoreBonus = Math.floor((300 - data.consumption) * 2); // Menos consumo = mais pontos
    setCurrentScore(prev => prev + Math.max(scoreBonus, 50));
    
    // Verifica se subiu de nível
    const newLevel = Math.floor((currentScore + scoreBonus) / 200);
    if (newLevel > currentLevel) {
      setCurrentLevel(newLevel);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-cyan-50">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Upload de fatura - destaque no topo */}
        <div className="max-w-4xl mx-auto">
          <InvoiceUpload onInvoiceProcessed={handleInvoiceProcessed} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Coluna principal - Score, Level e Ações */}
          <div className="xl:col-span-3 space-y-8">
            <ScoreCard score={currentScore} level={currentLevel} />
            <LevelProgress />
            <ActionCards />
          </div>
          
          {/* Sidebar - Leaderboard e Recomendações */}
          <div className="xl:col-span-1 space-y-8">
            <Leaderboard />
            <SmartRecommendations 
              invoiceData={invoiceData}
              currentScore={currentScore}
              userLevel={currentLevel}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
