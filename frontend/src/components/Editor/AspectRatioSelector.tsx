import { useTranslation } from 'react-i18next';
import { useStore } from '@/store/store';
import type { AspectRatio } from '@/types';

const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: '1:1' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '4:3', label: '4:3' },
  { value: '3:4', label: '3:4' },
];

export function AspectRatioSelector() {
  const { t } = useTranslation();
  const { aspectRatio, setAspectRatio } = useStore();

  return (
    <div className="selector">
      <label className="selector-label">{t('editor.aspectRatio')}</label>
      <div className="aspect-ratio-options">
        {ASPECT_RATIOS.map((ratio) => (
          <button
            key={ratio.value}
            className={`aspect-ratio-btn ${aspectRatio === ratio.value ? 'active' : ''}`}
            onClick={() => setAspectRatio(ratio.value)}
          >
            {ratio.label}
          </button>
        ))}
      </div>
    </div>
  );
}
