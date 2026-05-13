import { useQuery } from '@tanstack/react-query';

import { getRecommendations, RecommendationContext } from '@/api/recommendation';
import { useAuthStore } from '@/store/authStore';

export const useRecommendations = (
  context: RecommendationContext,
  targetId?: string,
) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ['recommendations', context, targetId, Boolean(accessToken)],
    queryFn: () => getRecommendations(accessToken as string, context, targetId),
    enabled: Boolean(accessToken),
    staleTime: 1000 * 60 * 5,
  });
};
