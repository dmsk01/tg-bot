import { useTranslation } from 'react-i18next';
import { useStore } from '@/store/store';
import { toast } from 'react-toastify';

export function GenerateButton() {
  const { t } = useTranslation();
  const {
    prompt,
    isGenerating,
    models,
    selectedModel,
    createGeneration,
    pollGenerationStatus,
    refreshBalance,
    user,
  } = useStore();

  const selectedModelData = models.find((m) => m.name === selectedModel);
  const cost = selectedModelData?.costPerGeneration || 0;
  const canGenerate = prompt.trim().length > 0 && !isGenerating && (user?.balance || 0) >= cost;

  const handleGenerate = async () => {
    try {
      const generationId = await createGeneration();
      if (generationId) {
        const result = await pollGenerationStatus(generationId);
        await refreshBalance();

        if (result.status === 'COMPLETED') {
          toast.success(t('editor.generationComplete'));
        } else if (result.status === 'FAILED') {
          toast.error(t('errors.generationFailed'));
        }
      }
    } catch (error) {
      if ((error as Error).message.includes('Insufficient')) {
        toast.error(t('errors.insufficientBalance'));
      } else {
        toast.error(t('errors.generic'));
      }
    }
  };

  return (
    <div className="generate-section">
      <div className="cost-info">{t('editor.cost', { cost: cost.toFixed(2) })}</div>
      <button className="btn btn-generate" onClick={handleGenerate} disabled={!canGenerate}>
        {isGenerating ? t('editor.generating') : t('editor.generate')}
      </button>
    </div>
  );
}
