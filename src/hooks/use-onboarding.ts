import { useQuery } from '@tanstack/react-query';
import { getUserProfile } from '@/utils/dataManager';

export const useOnboarding = () => {
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getUserProfile,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    hasCompletedOnboarding: profile?.hasCompletedOnboarding ?? false,
    isLoading,
    error,
    profile,
  };
}; 