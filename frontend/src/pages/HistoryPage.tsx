import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store/store';

export function HistoryPage() {
  const { t } = useTranslation();
  const { generations, fetchHistory, setPrompt, setSelectedModel, setAspectRatio } = useStore();

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleRepeat = (generation: (typeof generations)[0]) => {
    setPrompt(generation.prompt);
    setSelectedModel(generation.model);
    setAspectRatio(generation.aspectRatio as '1:1' | '16:9' | '9:16' | '4:3' | '3:4');
  };

  return (
    <div className="page history-page">
      <h2 className="page-title">{t('history.title')}</h2>

      {generations.length === 0 ? (
        <div className="empty-state">{t('history.empty')}</div>
      ) : (
        <div className="history-grid">
          {generations.map((generation) => (
            <div key={generation.id} className="history-card">
              {generation.generatedImageUrl && (
                <img
                  src={generation.generatedImageUrl}
                  alt={generation.prompt}
                  className="history-image"
                />
              )}
              <div className="history-info">
                <p className="history-prompt">{generation.prompt.slice(0, 100)}...</p>
                <div className="history-meta">
                  <span>{generation.model}</span>
                  <span>{generation.aspectRatio}</span>
                  <span>{generation.status}</span>
                </div>
                <button className="btn btn-small" onClick={() => handleRepeat(generation)}>
                  {t('history.repeat')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
