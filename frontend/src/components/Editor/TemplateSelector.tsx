import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store/store';

export function TemplateSelector() {
  const { t } = useTranslation();
  const { templates, selectedTemplate, setSelectedTemplate, fetchTemplates, isLoadingTemplates } =
    useStore();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current && templates.length === 0) {
      hasFetched.current = true;
      fetchTemplates();
    }
  }, [templates.length, fetchTemplates]);

  if (isLoadingTemplates) {
    return <div className="selector-loading">{t('app.loading')}</div>;
  }

  return (
    <div className="selector">
      <label className="selector-label">{t('editor.selectTemplate')}</label>
      <div className="template-grid">
        {templates.map((template) => (
          <button
            key={template.id}
            className={`template-card ${selectedTemplate?.id === template.id ? 'active' : ''}`}
            onClick={() =>
              setSelectedTemplate(selectedTemplate?.id === template.id ? null : template)
            }
          >
            <span className="template-name">{template.name}</span>
            <span className="template-category">{template.category}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
