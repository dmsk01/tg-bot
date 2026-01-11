import { useTranslation } from 'react-i18next';
import { useStore } from '@/store/store';

export function Header() {
  const { t } = useTranslation();
  const user = useStore((state) => state.user);

  return (
    <header className="header">
      <h1 className="header-title">{t('app.title')}</h1>
      {user && (
        <div className="header-balance">
          {t('balance.amount', { amount: user.balance.toFixed(2) })}
        </div>
      )}
    </header>
  );
}
