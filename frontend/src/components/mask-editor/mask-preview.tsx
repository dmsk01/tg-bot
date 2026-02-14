import type { MaskPreviewProps } from './types';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

export function MaskPreview({ maskUrl, onEdit, onClear }: MaskPreviewProps) {
  return (
    <>
      {/* Mask overlay */}
      <Box
        component="img"
        src={maskUrl}
        alt="Mask"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          pointerEvents: 'none',
          opacity: 0.4,
          mixBlendMode: 'screen',
          filter: 'hue-rotate(200deg) saturate(3)',
        }}
      />

      {/* Animated border overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: `url(${maskUrl})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            opacity: 0.6,
            maskImage: `url(${maskUrl})`,
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskImage: `url(${maskUrl})`,
            WebkitMaskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            animation: 'pulse 1.5s ease-in-out infinite',
          },
          '@keyframes pulse': {
            '0%, 100%': { opacity: 0.3 },
            '50%': { opacity: 0.6 },
          },
        }}
      />

      {/* Control buttons */}
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          display: 'flex',
          gap: 0.5,
        }}
      >
        <IconButton
          size="small"
          onClick={onEdit}
          sx={{
            bgcolor: 'rgba(0,0,0,0.6)',
            color: 'white',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
          }}
        >
          <Iconify icon="solar:pen-bold" width={16} />
        </IconButton>
        <IconButton
          size="small"
          onClick={onClear}
          sx={{
            bgcolor: 'rgba(0,0,0,0.6)',
            color: 'white',
            '&:hover': { bgcolor: 'error.main' },
          }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" width={16} />
        </IconButton>
      </Box>
    </>
  );
}
