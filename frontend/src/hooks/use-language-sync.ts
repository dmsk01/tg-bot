import { useTranslation } from 'react-i18next';
import { useRef, useEffect, useCallback } from 'react';

import { logger } from 'src/utils/logger';

import { useStore } from 'src/store/store';
import { apiService } from 'src/services/api.service';

const BASE_INTERVAL = 30000; // 30 seconds
const MAX_INTERVAL = 300000; // 5 minutes max backoff

export function useLanguageSync() {
  const { i18n } = useTranslation();
  const { user } = useStore();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentIntervalRef = useRef(BASE_INTERVAL);
  const pollLanguageRef = useRef<(() => Promise<void>) | undefined>(undefined);

  const handleLanguageChange = useCallback(
    (newLang: string) => {
      if (i18n.language !== newLang) {
        i18n.changeLanguage(newLang);
      }
    },
    [i18n]
  );

  const scheduleNextPoll = useCallback((delay: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      pollLanguageRef.current?.();
    }, delay);
  }, []);

  const pollLanguage = useCallback(async () => {
    try {
      const userData = await apiService.getMe();
      if (userData.languageCode) {
        handleLanguageChange(userData.languageCode);
      }
      // Reset interval on success
      currentIntervalRef.current = BASE_INTERVAL;
      scheduleNextPoll(BASE_INTERVAL);
    } catch (error) {
      logger.error('Language sync polling failed:', error);
      // Exponential backoff on error
      currentIntervalRef.current = Math.min(currentIntervalRef.current * 2, MAX_INTERVAL);
      scheduleNextPoll(currentIntervalRef.current);
    }
  }, [handleLanguageChange, scheduleNextPoll]);

  // Update ref when pollLanguage changes
  useEffect(() => {
    pollLanguageRef.current = pollLanguage;
  }, [pollLanguage]);

  useEffect(() => {
    if (!user) return undefined;

    // Poll immediately on mount
    pollLanguage();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [user, pollLanguage]);
}
