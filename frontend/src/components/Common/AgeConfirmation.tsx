import { useTranslation } from 'react-i18next';
import { useStore } from '@/store/store';

export function AgeConfirmation() {
  const { t } = useTranslation();
  const { confirmAge, setShowAgeConfirmModal } = useStore();

  const handleConfirm = async () => {
    await confirmAge();
    setShowAgeConfirmModal(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-handle" />
        <h2 className="modal-title">{t('ageConfirm.title')}</h2>
        <p className="modal-message">{t('ageConfirm.message')}</p>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={handleConfirm}>
            {t('ageConfirm.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
