
import React from 'react';
import Header from '../components/Header';
import ScoreCard from '../components/ScoreCard';
import ActionCards from '../components/ActionCards';
import Leaderboard from '../components/Leaderboard';
import LevelProgress from '../components/LevelProgress';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <ScoreCard />
            <LevelProgress />
            <ActionCards />
          </div>
          <div className="lg:col-span-1">
            <Leaderboard />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
