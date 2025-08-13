import { useDiagnosis } from '@/hooks/useDiagnosis';
import { computeDiagnosisAnalytics, type DiagnosisAnalytics } from '@/utils/diagnosisAnalytics';
import { useMemo } from 'react';

export function useDiagnosisAnalytics(userId?: string, userState?: string) {
  const { data, loading, error } = useDiagnosis(userId);
  
  const analytics = useMemo(() => {
    if (!data || data.length === 0) return null;
    try {
      return computeDiagnosisAnalytics(data as any, userState);
    } catch {
      return null;
    }
  }, [data, userState]);

  return {
    data,
    analytics,
    loading,
    error
  };
}
