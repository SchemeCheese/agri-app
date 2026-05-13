import { useCallback } from 'react';

import { BehaviorAction, trackBehavior } from '@/api/behavior';
import { useAuthStore } from '@/store/authStore';

export const useBehaviorTracker = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);

  const track = useCallback(
    async (
      action: BehaviorAction,
      options?: {
        targetId?: string;
        metadata?: Record<string, unknown>;
        weight?: number;
      },
    ) => {
      try {
        await trackBehavior(
          {
            userId: user?.id,
            action,
            targetId: options?.targetId,
            metadata: options?.metadata,
            weight: options?.weight,
          },
          accessToken,
        );
      } catch {
        // Tracking should not block critical user actions.
      }
    },
    [accessToken, user?.id],
  );

  return { track };
};
