import { Badge } from '@/components/ui/badge';
import { UserProfileData } from '@/types/mvp';
import UserProfile from '@/components/UserProfile';

interface DynamicContextProfileViewProps {
  isProfileComplete: boolean;
  profile: UserProfileData;
  profileCompletion: number;
  onProfileUpdate: (data: UserProfileData) => void;
}

const DynamicContextProfileView = ({
  isProfileComplete,
  profile,
  profileCompletion,
  onProfileUpdate,
}: DynamicContextProfileViewProps) => (
  <div className="flex h-full flex-col gap-4">
    <div className="rounded-[18px] border border-[#365f58] bg-[#163f39] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xl font-semibold text-[#f5f8f3]">{profile.consumerType}</p>
          <p className="mt-2 text-sm leading-6 text-[#c5d8c8]">
            {isProfileComplete
              ? 'Seu contexto ja sustenta a leitura atual. Se precisar, voce pode refinar essa base por aqui.'
              : 'Complete a base da jornada para deixar leitura, memoria e continuidade mais coerentes com sua realidade.'}
          </p>
        </div>
        <Badge className="border border-[#365f58] bg-[#143d37] text-[#f5f8f3]">
          {profileCompletion}%
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-[14px] bg-[#113731] px-4 py-4">
          <div className="text-[#9dbfa6]">Local</div>
          <div className="mt-1 font-semibold text-[#f5f8f3]">
            {profile.location || 'Nao informado'}
          </div>
        </div>
        <div className="rounded-[14px] bg-[#113731] px-4 py-4">
          <div className="text-[#9dbfa6]">Energia</div>
          <div className="mt-1 font-semibold text-[#f5f8f3]">
            {profile.energyPreference}
          </div>
        </div>
      </div>
    </div>

    <div className="rounded-[18px] border border-[#365f58] bg-[#113731] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#f5f8f3]">
            {isProfileComplete ? 'Refinar base da jornada' : 'Completar base da jornada'}
          </p>
          <p className="mt-1 text-sm leading-6 text-[#c5d8c8]">
            A edicao continua usando o fluxo existente da jornada, sem criar persistencia nova.
          </p>
        </div>
        <UserProfile
          value={profile}
          completionPercent={profileCompletion}
          isComplete={isProfileComplete}
          onProfileUpdate={onProfileUpdate}
          triggerLabel={isProfileComplete ? 'Editar perfil' : 'Completar perfil'}
          triggerClassName="rounded-[14px] border-[#365f58] bg-[#163f39] text-[#f5f8f3] hover:bg-[#1b4a43] hover:text-[#f5f8f3]"
        />
      </div>
    </div>
  </div>
);

export default DynamicContextProfileView;
