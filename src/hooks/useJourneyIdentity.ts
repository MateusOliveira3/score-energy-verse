import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { resolveJourneyIdentity } from '@/lib/journeyIdentity';

export const useJourneyIdentity = () => {
  const { user, loading } = useAuth();

  const journeyIdentity = useMemo(() => {
    if (loading) {
      return null;
    }

    return resolveJourneyIdentity(user);
  }, [loading, user]);

  return {
    journeyIdentity,
    loading,
  };
};
