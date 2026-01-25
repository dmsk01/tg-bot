import { useTranslation } from 'react-i18next';
import { useRef, useEffect, useCallback } from 'react';

import { useStore } from 'src/store/store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useLanguageSync() {
  const { i18n } = useTranslation();
  const { user } = useStore();
  const eventSourceRef = useRef<EventSource | null>(null);

  const handleLanguageChange = useCallback((newLang: string) => {
    if (i18n.language !== newLang) {
      i18n.changeLanguage(newLang);
    }
  }, [i18n]);

  useEffect(() => {
    if (!user) return undefined;

    const initData = window.Telegram?.WebApp?.initData;
    if (!initData) return undefined;

    const url = `${API_URL}/api/user/language-events?initData=${encodeURIComponent(initData)}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'language_changed') {
          handleLanguageChange(data.languageCode);
        }
      } catch {
        // Ignore parse errors (heartbeat comments)
      }
    };

    eventSource.onerror = () => {
      // EventSource auto-reconnects, no action needed
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [user, handleLanguageChange]);
}
