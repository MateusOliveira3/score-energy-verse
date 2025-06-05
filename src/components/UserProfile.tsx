
import React, { useState } from 'react';
import { User, MapPin, Building, Users, Zap, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface UserProfileData {
  consumerType: string;
  location: string;
  propertySize: number;
  peopleCount: number;
  energyPreference: string;
}

interface UserProfileProps {
  onProfileUpdate: (data: UserProfileData) => void;
}

const UserProfile = ({ onProfileUpdate }: UserProfileProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileData>({
    consumerType: 'Residencial',
    location: '',
    propertySize: 0,
    peopleCount: 1,
    energyPreference: 'Convencional'
  });

  const consumerTypes = ['Residencial', 'Comercial', 'Restaurante', 'Escola', 'Indústria'];
  const energyPreferences = ['Solar', 'Convencional', 'Híbrido', 'Eólica'];

  const handleSave = () => {
    onProfileUpdate(profileData);
    setIsOpen(false);
  };

  const getLocationFromGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        // Simular conversão de coordenadas para cidade/estado
        setProfileData(prev => ({
          ...prev,
          location: 'São Paulo, SP' // Placeholder - em implementação real usaria API de geocoding
        }));
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-emerald-600 hover:text-emerald-700">
          <User className="h-4 w-4 mr-2" />
          Configurar Perfil
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-emerald-700">Perfil do Usuário</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Tipo de Consumidor */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              <Building className="h-4 w-4 inline mr-1" />
              Tipo de Consumidor
            </label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-md"
              value={profileData.consumerType}
              onChange={(e) => setProfileData(prev => ({...prev, consumerType: e.target.value}))}
            >
              {consumerTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Localização */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              <MapPin className="h-4 w-4 inline mr-1" />
              Localização
            </label>
            <div className="flex space-x-2">
              <Input
                placeholder="Cidade, Estado"
                value={profileData.location}
                onChange={(e) => setProfileData(prev => ({...prev, location: e.target.value}))}
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={getLocationFromGPS}
              >
                GPS
              </Button>
            </div>
          </div>

          {/* Tamanho do Imóvel */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Tamanho do Imóvel (m²)
            </label>
            <Input
              type="number"
              placeholder="Ex: 120"
              value={profileData.propertySize || ''}
              onChange={(e) => setProfileData(prev => ({...prev, propertySize: Number(e.target.value)}))}
            />
          </div>

          {/* Número de Pessoas */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              <Users className="h-4 w-4 inline mr-1" />
              Número de Pessoas/Funcionários
            </label>
            <Input
              type="number"
              placeholder="Ex: 4"
              value={profileData.peopleCount || ''}
              onChange={(e) => setProfileData(prev => ({...prev, peopleCount: Number(e.target.value)}))}
            />
          </div>

          {/* Preferência Energética */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              <Zap className="h-4 w-4 inline mr-1" />
              Preferência Energética
            </label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-md"
              value={profileData.energyPreference}
              onChange={(e) => setProfileData(prev => ({...prev, energyPreference: e.target.value}))}
            >
              {energyPreferences.map(pref => (
                <option key={pref} value={pref}>{pref}</option>
              ))}
            </select>
          </div>

          <Button onClick={handleSave} className="w-full bg-emerald-600 hover:bg-emerald-700">
            Salvar Perfil
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfile;
