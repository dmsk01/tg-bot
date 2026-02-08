import { useTranslation } from 'react-i18next';
import { useRef, useEffect, useCallback } from 'react';

import { useStore } from 'src/store/store';
import { apiService } from 'src/services/api.service';

const POLL_INTERVAL = 30000; // 30 seconds

export function useLanguageSync() {
  const { i18n } = useTranslation();
  const { user } = useStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleLanguageChange = useCallback(
    (newLang: string) => {
      if (i18n.language !== newLang) {
        i18n.changeLanguage(newLang);
      }
    },
    [i18n]
  );

  const pollLanguage = useCallback(async () => {
    try {
      const userData = await apiService.getMe();
      if (userData.languageCode) {
        handleLanguageChange(userData.languageCode);
      }
    } catch {
      // Silently ignore polling errors
    }
  }, [handleLanguageChange]);

  useEffect(() => {
    if (!user) return undefined;

    // Poll immediately on mount
    pollLanguage();

    // Set up polling interval
    intervalRef.current = setInterval(pollLanguage, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, pollLanguage]);
}
