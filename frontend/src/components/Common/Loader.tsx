import { useTranslation } from 'react-i18next';

interface LoaderProps {
  text?: string;
}

export function Loader({ text }: LoaderProps) {
  const { t } = useTranslation();

  return (
    <div className="loader">
      <div className="loader-spinner"></div>
      <p>{text || t('app.loading')}</p>
    </div>
  );
}
