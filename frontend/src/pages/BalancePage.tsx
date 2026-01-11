import { useTranslation } from 'react-i18next';
import { useStore } from '@/store/store';
import { toast } from 'react-toastify';

const TOP_UP_AMOUNTS = [100, 300, 500, 1000];

export function BalancePage() {
  const { t } = useTranslation();
  const user = useStore((state) => state.user);

  const handleTopUp = (amount: number) => {
    // TODO: Implement payment when YooKassa is integrated
    toast.info(`Payment for ${amount} RUB - coming soon!`);
  };

  return (
    <div className="page balance-page">
      <h2 className="page-title">{t('balance.title')}</h2>

      <div className="balance-card">
        <div className="balance-label">{t('balance.current')}</div>
        <div className="balance-value">
          {t('balance.amount', { amount: (user?.balance || 0).toFixed(2) })}
        </div>
      </div>

      <div className="top-up-section">
        <h3>{t('balance.topUp')}</h3>
        <div className="top-up-grid">
          {TOP_UP_AMOUNTS.map((amount) => (
            <button key={amount} className="btn btn-top-up" onClick={() => handleTopUp(amount)}>
              {amount} RUB
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
