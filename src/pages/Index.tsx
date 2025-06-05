
import React, { useState } from 'react';
import Header from '../components/Header';
import ScoreCard from '../components/ScoreCard';
import ActionCards from '../components/ActionCards';
import Leaderboard from '../components/Leaderboard';
import LevelProgress from '../components/LevelProgress';
import InvoiceUpload from '../components/InvoiceUpload';
import SmartRecommendations from '../components/SmartRecommendations';
import UserProfile from '../components/UserProfile';
import MascotCustomization from '../components/MascotCustomization';
import EnergyNews from '../components/EnergyNews';

interface InvoiceData {
  consumption: number;
  totalValue: number;
  taxPercentage: number;
  peakHours: string;
  month: string;
}

interface UserProfileData {
  consumerType: string;
  location: string;
  propertySize: number;
  peopleCount: number;
  energyPreference: string;
}

interface MascotCustomization {
  name: string;
  emoji: string;
  colorPalette: string;
  borderEffect: string;
}

const Index = () => {
  const [invoiceData, setInvoiceData] = useState<InvoiceData | undefined>();
  const [currentScore, setCurrentScore] = useState(1247);
  const [currentLevel, setCurrentLevel] = useState(7);
  const [userProfile, setUserProfile] = useState<UserProfileData>({
    consumerType: 'Residencial',
    location: '',
    propertySize: 0,
    peopleCount: 1,
    energyPreference: 'Convencional'
  });
  const [mascotCustomization, setMascotCustomization] = useState<MascotCustomization>({
    name: 'EcoFriend',
    emoji: '🌱',
    colorPalette: 'emerald',
    borderEffect: 'none'
  });

  const handleInvoiceProcessed = (data: InvoiceData) => {
    setInvoiceData(data);
    // Cálculo contextual do score baseado no perfil do usuário
    const baseScoreBonus = Math.floor((300 - data.consumption) * 2);
    
    // Bônus contextual baseado no tipo de consumidor
    let contextualMultiplier = 1;
    if (userProfile.consumerType === 'Residencial' && data.consumption < 150) {
      contextualMultiplier = 1.2; // Bônus para residências eficientes
    } else if (userProfile.consumerType === 'Comercial' && data.consumption < 500) {
      contextualMultiplier = 1.15;
    }
    
    const finalBonus = Math.floor(baseScoreBonus * contextualMultiplier);
    setCurrentScore(prev => prev + Math.max(finalBonus, 50));
    
    // Verifica se subiu de nível
    const newLevel = Math.floor((currentScore + finalBonus) / 200);
    if (newLevel > currentLevel) {
      setCurrentLevel(newLevel);
    }
  };

  const handleProfileUpdate = (profileData: UserProfileData) => {
    setUserProfile(profileData);
    console.log('Perfil atualizado:', profileData);
  };

  const handleMascotCustomization = (customization: MascotCustomization) => {
    setMascotCustomization(customization);
    console.log('Mascote personalizado:', customization);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-cyan-50">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Upload de fatura - destaque no topo */}
        <div className="max-w-4xl mx-auto">
          <InvoiceUpload onInvoiceProcessed={handleInvoiceProcessed} />
        </div>

        {/* Botões de configuração */}
        <div className="flex justify-center space-x-4">
          <UserProfile onProfileUpdate={handleProfileUpdate} />
          <MascotCustomization 
            onCustomizationUpdate={handleMascotCustomization}
            currentScore={currentScore}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Coluna principal - Score, Level e Ações */}
          <div className="xl:col-span-3 space-y-8">
            <ScoreCard 
              score={currentScore} 
              level={currentLevel}
              consumerType={userProfile.consumerType}
              mascotCustomization={mascotCustomization}
            />
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
              userProfile={userProfile}
            />
          </div>
        </div>

        {/* Seção de Notícias */}
        <div className="max-w-6xl mx-auto">
          <EnergyNews />
        </div>
      </main>
    </div>
  );
};

export default Index;
