import { useTranslation } from 'react-i18next';
import { useStore } from '@/store/store';

export function PromptEditor() {
  const { t } = useTranslation();
  const { prompt, negativePrompt, setPrompt, setNegativePrompt } = useStore();

  return (
    <div className="prompt-editor">
      <div className="prompt-field">
        <textarea
          className="prompt-textarea"
          placeholder={t('editor.promptPlaceholder')}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
        />
      </div>
      <div className="prompt-field">
        <textarea
          className="prompt-textarea negative"
          placeholder={t('editor.negativePromptPlaceholder')}
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          rows={2}
        />
      </div>
    </div>
  );
}
