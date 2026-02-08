import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { useStore } from 'src/store/store';

export function TemplateSelector() {
  const { t } = useTranslation();
  const { templates, selectedTemplate, setSelectedTemplate, fetchTemplates, isLoadingTemplates } =
    useStore();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current && (!templates || templates.length === 0)) {
      hasFetched.current = true;
      fetchTemplates();
    }
  }, [templates, fetchTemplates]);

  if (isLoadingTemplates) {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
          {t('editor.selectTemplate')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} sx={{ p: 1.5, minWidth: 120 }}>
              <Skeleton variant="text" width={80} height={16} />
              <Skeleton variant="rounded" width={60} height={20} sx={{ mt: 0.5, borderRadius: 3 }} />
            </Card>
          ))}
        </Box>
      </Box>
    );
  }

  if (!templates || templates.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        {t('editor.selectTemplate')}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', maxHeight: 200, overflowY: 'auto' }}>
        {templates.map((template) => (
          <Card
            key={template.id}
            onClick={() =>
              setSelectedTemplate(selectedTemplate?.id === template.id ? null : template)
            }
            sx={{
              p: 1.5,
              cursor: 'pointer',
              minWidth: 120,
              transition: 'all 0.2s',
              border: '2px solid',
              borderColor: selectedTemplate?.id === template.id ? 'primary.main' : 'transparent',
              bgcolor: selectedTemplate?.id === template.id ? 'primary.lighter' : 'background.paper',
              '&:hover': {
                borderColor: 'primary.light',
              },
            }}
          >
            <Typography variant="caption" fontWeight="bold" noWrap>
              {template.name}
            </Typography>
            <Chip size="small" label={template.category} sx={{ mt: 0.5 }} />
          </Card>
        ))}
      </Box>
    </Box>
  );
}
