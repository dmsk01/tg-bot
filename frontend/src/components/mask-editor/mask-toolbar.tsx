import type { MaskToolbarProps } from './types';

import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import SvgIcon from '@mui/material/SvgIcon';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { Iconify } from 'src/components/iconify';

function PolygonIcon({ size = 20 }: { size?: number }) {
  return (
    <SvgIcon sx={{ width: size, height: size }}>
      <path
        fill="currentColor"
        d="M12 2L3 7v10l9 5l9-5V7l-9-5zm0 2.18l6 3.33v6.98l-6 3.33l-6-3.33V7.51l6-3.33z"
      />
    </SvgIcon>
  );
}

export function MaskToolbar({
  tool,
  brushSize,
  onToolChange,
  onBrushSizeChange,
  onCloseLasso,
  showCloseLasso,
}: MaskToolbarProps) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: 2,
        py: 1.5,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      {/* Tool selection */}
      <ToggleButtonGroup
        value={tool}
        exclusive
        onChange={(_, value) => value && onToolChange(value)}
        size="small"
      >
        <ToggleButton value="brush" aria-label={t('maskEditor.brush')}>
          <Iconify icon="solar:pen-bold" width={20} />
        </ToggleButton>
        <ToggleButton value="lasso" aria-label={t('maskEditor.lasso')}>
          <PolygonIcon size={20} />
        </ToggleButton>
      </ToggleButtonGroup>

      {/* Brush size slider */}
      {tool === 'brush' && (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1, mx: 1 }}>
          <Iconify icon="eva:minus-circle-fill" width={18} sx={{ color: 'text.secondary' }} />
          <Slider
            value={brushSize}
            onChange={(_, value) => onBrushSizeChange(value as number)}
            min={5}
            max={100}
            size="small"
            sx={{ flex: 1 }}
          />
          <Iconify icon="solar:add-circle-bold" width={18} sx={{ color: 'text.secondary' }} />
        </Box>
      )}

      {/* Close lasso button */}
      {tool === 'lasso' && showCloseLasso && (
        <Button
          variant="outlined"
          size="small"
          onClick={onCloseLasso}
          startIcon={<Iconify icon="solar:check-circle-bold" width={18} />}
        >
          {t('maskEditor.closeLasso')}
        </Button>
      )}
    </Box>
  );
}
