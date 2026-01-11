import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Layout/Header';
import { Navigation } from '@/components/Layout/Navigation';
import { Loader } from '@/components/Common/Loader';
import { AgeConfirmation } from '@/components/Common/AgeConfirmation';
import { EditorPage } from '@/pages/EditorPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { BalancePage } from '@/pages/BalancePage';
import { useStore } from '@/store/store';
import { apiService } from '@/services/api.service';
import 'react-toastify/dist/ReactToastify.css';
import '@/styles/main.css';

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

function App() {
  const { i18n } = useTranslation();
  const { user, isLoading, fetchUser, showAgeConfirmModal, setShowAgeConfirmModal } = useStore();

  useEffect(() => {
    const initApp = async () => {
      // Initialize Telegram WebApp
      const tg = window.Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
        // Use Telegram theme colors (auto light/dark)
        tg.setHeaderColor('secondary_bg_color');
        tg.setBackgroundColor('bg_color');

        // Set init data for API
        if (tg.initData) {
          apiService.setInitData(tg.initData);
        }

        // Set language from Telegram
        const userLang = tg.initDataUnsafe.user?.language_code;
        if (userLang) {
          i18n.changeLanguage(userLang.startsWith('en') ? 'en' : 'ru');
        }
      }

      // Fetch user data
      await fetchUser();
    };

    initApp();
  }, [fetchUser, i18n]);

  useEffect(() => {
    // Check if age confirmation is needed
    if (user && !user.isAgeConfirmed) {
      setShowAgeConfirmModal(true);
    }

    // Update language from user settings
    if (user?.languageCode) {
      i18n.changeLanguage(user.languageCode);
    }
  }, [user, setShowAgeConfirmModal, i18n]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <BrowserRouter>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<EditorPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/balance" element={<BalancePage />} />
          </Routes>
        </main>
        <Navigation />

        {showAgeConfirmModal && <AgeConfirmation />}

        <ToastContainer
          position="bottom-center"
          autoClose={3000}
          hideProgressBar
          theme="colored"
        />
      </div>
    </BrowserRouter>
  );
}

export default App;
