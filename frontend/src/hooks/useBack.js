import { useCallback } from 'react';
import { useRouter } from 'expo-router';

/**
 * Returns a back-navigation function that falls back to `fallbackRoute`
 * when there is no history to go back to (e.g. direct URL load on web).
 */
export function useBack(fallbackRoute = '/') {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallbackRoute);
    }
  }, [router, fallbackRoute]);
}
