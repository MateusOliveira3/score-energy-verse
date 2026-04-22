import React, { useEffect, useState } from 'react';
import { User, MapPin, Building, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserProfileData } from '@/types/mvp';

interface UserProfileProps {
  value: UserProfileData;
  completionPercent: number;
  isComplete: boolean;
  onProfileUpdate: (data: UserProfileData) => void;
}

const UserProfile = ({
  value,
  completionPercent,
  isComplete,
  onProfileUpdate,
}: UserProfileProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileData>(value);
  const fieldLabelClassName =
    'mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800';
  const fieldClassName =
    'w-full rounded-md border border-slate-300 bg-white text-slate-900 shadow-sm transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200';

  const consumerTypes = ['Residencial', 'Comercial', 'Restaurante', 'Escola', 'Industria'];
  const energyPreferences = ['Solar', 'Convencional', 'Hibrido', 'Eolica'];

  useEffect(() => {
    setProfileData(value);
  }, [value]);

  const handleSave = () => {
    onProfileUpdate({
      consumerType: profileData.consumerType,
      location: profileData.location,
      propertySize: profileData.propertySize,
      peopleCount: profileData.peopleCount,
      energyPreference: profileData.energyPreference,
    });
    setIsOpen(false);
  };

  const getLocationFromGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(() => {
        setProfileData((currentProfile) => ({
          ...currentProfile,
          location: 'Sao Paulo, SP',
        }));
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-emerald-600 hover:text-emerald-700">
          <User className="h-4 w-4 mr-2" />
          {isComplete ? `Editar Perfil (${completionPercent}%)` : `Completar Perfil (${completionPercent}%)`}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md border border-emerald-100 bg-white shadow-2xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-emerald-700">Perfil do Usuario</DialogTitle>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all"
              style={{ width: `${completionPercent}%` }}
            ></div>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          <p className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-3 text-sm text-slate-700">
            Este contexto melhora a leitura da fatura, orienta o mascote e torna o score mais
            explicavel.
          </p>

          <div className="space-y-1">
            <label className={fieldLabelClassName}>
              <Building className="h-4 w-4 text-emerald-600" />
              Tipo de Consumidor
            </label>
            <select
              className={`${fieldClassName} px-3 py-2.5`}
              value={profileData.consumerType}
              onChange={(event) =>
                setProfileData((currentProfile) => ({
                  ...currentProfile,
                  consumerType: event.target.value,
                }))
              }
            >
              {consumerTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className={fieldLabelClassName}>
              <MapPin className="h-4 w-4 text-emerald-600" />
              Localizacao
            </label>
            <div className="flex space-x-2">
              <Input
                className={`${fieldClassName} h-11`}
                placeholder="Cidade, Estado"
                value={profileData.location}
                onChange={(event) =>
                  setProfileData((currentProfile) => ({
                    ...currentProfile,
                    location: event.target.value,
                  }))
                }
              />
              <Button
                variant="outline"
                size="sm"
                className="h-11 border-slate-300 text-slate-700 hover:border-emerald-400 hover:bg-emerald-50"
                onClick={getLocationFromGPS}
              >
                GPS
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <label className={fieldLabelClassName}>
              Tamanho do Imovel (m2)
            </label>
            <Input
              className={`${fieldClassName} h-11`}
              type="number"
              placeholder="Ex: 120"
              value={profileData.propertySize || ''}
              onChange={(event) =>
                setProfileData((currentProfile) => ({
                  ...currentProfile,
                  propertySize: Number(event.target.value),
                }))
              }
            />
          </div>

          <div className="space-y-1">
            <label className={fieldLabelClassName}>
              <Users className="h-4 w-4 text-emerald-600" />
              Numero de Pessoas ou Funcionarios
            </label>
            <Input
              className={`${fieldClassName} h-11`}
              type="number"
              placeholder="Ex: 4"
              value={profileData.peopleCount || ''}
              onChange={(event) =>
                setProfileData((currentProfile) => ({
                  ...currentProfile,
                  peopleCount: Number(event.target.value),
                }))
              }
            />
          </div>

          <div className="space-y-1">
            <label className={fieldLabelClassName}>
              <Zap className="h-4 w-4 text-emerald-600" />
              Preferencia Energetica
            </label>
            <select
              className={`${fieldClassName} px-3 py-2.5`}
              value={profileData.energyPreference}
              onChange={(event) =>
                setProfileData((currentProfile) => ({
                  ...currentProfile,
                  energyPreference: event.target.value,
                }))
              }
            >
              {energyPreferences.map((preference) => (
                <option key={preference} value={preference}>
                  {preference}
                </option>
              ))}
            </select>
          </div>

          <Button onClick={handleSave} className="h-11 w-full bg-emerald-600 hover:bg-emerald-700 shadow-sm">
            Salvar Perfil
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfile;
