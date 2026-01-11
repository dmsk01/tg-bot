import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store/store';

export function ModelSelector() {
  const { t } = useTranslation();
  const { models, selectedModel, setSelectedModel, fetchModels, isLoadingModels } = useStore();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current && (!models || models.length === 0)) {
      hasFetched.current = true;
      fetchModels();
    }
  }, [models, fetchModels]);

  if (isLoadingModels) {
    return <div className="selector-loading">{t('app.loading')}</div>;
  }

  if (!models || models.length === 0) {
    return <div className="selector-empty">{t('editor.noModels')}</div>;
  }

  return (
    <div className="selector">
      <label className="selector-label">{t('editor.selectModel')}</label>
      <div className="selector-options">
        {models.map((model) => (
          <button
            key={model.id}
            className={`selector-option ${selectedModel === model.name ? 'active' : ''}`}
            onClick={() => setSelectedModel(model.name)}
          >
            <span className="option-name">{model.displayName}</span>
            <span className="option-cost">{model.costPerGeneration} RUB</span>
          </button>
        ))}
      </div>
    </div>
  );
}
