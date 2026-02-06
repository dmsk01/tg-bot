import 'src/global.css';
import 'src/i18n/i18n';

import { SnackbarProvider } from 'notistack';
import { useTranslation } from 'react-i18next';
import { Suspense, useState, useEffect } from 'react';

import Box from '@mui/material/Box';

import { usePathname } from 'src/routes/hooks';

import { useLanguageSync } from 'src/hooks/use-language-sync';

import { useStore } from 'src/store/store';
import { apiService } from 'src/services/api.service';
import { themeConfig, ThemeProvider } from 'src/theme';

import { ProgressBar } from 'src/components/progress-bar';
import { MotionLazy } from 'src/components/animate/motion-lazy';
import { defaultSettings, SettingsProvider } from 'src/components/settings';

import { Header, Navigation } from 'src/sections/layout';
import { Loader, AgeConfirmation } from 'src/sections/common';

// ----------------------------------------------------------------------

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            language_code?: string;
          };
        };
        ready: () => void;
        expand: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
      };
    };
  }
}

type AppProps = {
  children: React.ReactNode;
};

const MIN_LOADER_TIME = 1000;

export default function App({ children }: AppProps) {
  const { i18n } = useTranslation();
  const { user, isLoading, fetchUser, showAgeConfirmModal, setShowAgeConfirmModal } = useStore();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useScrollToTop();
  useLanguageSync();

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, MIN_LOADER_TIME);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const initApp = async () => {
      // Initialize Telegram WebApp
      const tg = window.Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
        tg.setHeaderColor('secondary_bg_color');
        tg.setBackgroundColor('bg_color');

        if (tg.initData) {
          apiService.setInitData(tg.initData);
        }
      }

      await fetchUser();
    };

    initApp();

    // Refresh user data when Mini App becomes visible (handles cached app reopening)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUser();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchUser]);

  useEffect(() => {
    if (user && !user.isAgeConfirmed) {
      setShowAgeConfirmModal(true);
    }

    if (user?.languageCode) {
      i18n.changeLanguage(user.languageCode);
    }
  }, [user, setShowAgeConfirmModal, i18n]);

  return (
    <SettingsProvider defaultSettings={defaultSettings}>
      <ThemeProvider
        modeStorageKey={themeConfig.modeStorageKey}
        defaultMode={themeConfig.defaultMode}
      >
        <SnackbarProvider
          maxSnack={3}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <MotionLazy>
            <ProgressBar />

            {isLoading || !minTimeElapsed ? (
              <Loader />
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '100vh',
                }}
              >
                <Header />
                <Box
                  component="main"
                  sx={{
                    flexGrow: 1,
                    pt: 8,
                    pb: 10,
                  }}
                >
                  <Suspense fallback={<Loader />}>
                    {children}
                  </Suspense>
                </Box>
                <Navigation />
              </Box>
            )}

            {showAgeConfirmModal && <AgeConfirmation />}
          </MotionLazy>
        </SnackbarProvider>
      </ThemeProvider>
    </SettingsProvider>
  );
}

// ----------------------------------------------------------------------

function useScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
