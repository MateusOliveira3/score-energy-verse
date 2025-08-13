import { useDiagnosis } from '@/hooks/useDiagnosis';
import { computeDiagnosisAnalytics, type DiagnosisAnalytics } from '@/utils/diagnosisAnalytics';
import { useMemo } from 'react';

export function useDiagnosisAnalytics(userId?: string, userState?: string) {
  const { items, isLoading, error } = useDiagnosis(userId);
  
  const analytics = useMemo(() => {
    if (!items || items.length === 0) return null;
    try {
      return computeDiagnosisAnalytics(items as any, userState);
    } catch {
      return null;
    }
  }, [items, userState]);

  return {
    data: items,
    analytics,
    loading: isLoading,
    error
  };
}
