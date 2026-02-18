import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { useRef, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { urlToBase64 } from 'src/utils/image';

import { useStore } from 'src/store/store';
import { apiService } from 'src/services/api.service';

import { Iconify } from 'src/components/iconify';
import { MaskPreview, MaskEditorModal } from 'src/components/mask-editor';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ImageUploader() {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [maskEditorOpen, setMaskEditorOpen] = useState(false);

  const sourceImageUrl = useStore((state) => state.sourceImageUrl);
  const maskImageUrl = useStore((state) => state.maskImageUrl);
  const isUploading = useStore((state) => state.isUploading);
  const currentGeneration = useStore((state) => state.currentGeneration);
  const uploadSourceImage = useStore((state) => state.uploadSourceImage);
  const setSourceImageUrl = useStore((state) => state.setSourceImageUrl);
  const clearSourceImage = useStore((state) => state.clearSourceImage);
  const setMaskImageUrl = useStore((state) => state.setMaskImageUrl);
  const clearMask = useStore((state) => state.clearMask);
  const clearCurrentGeneration = useStore((state) => state.clearCurrentGeneration);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        enqueueSnackbar(t('editor.imageUploader.invalidType'), { variant: 'error' });
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        enqueueSnackbar(t('editor.imageUploader.fileTooLarge'), { variant: 'error' });
        return;
      }
      try {
        await uploadSourceImage(file);
      } catch (error) {
        // DEBUG: Show debug info on error
        const debugInfo = apiService.getDebugInfo();
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
         
        alert(`Upload Error:\n${errorMsg}\n\nDebug:\n${debugInfo}`);
        enqueueSnackbar(t('errors.generic'), { variant: 'error' });
      }
    },
    [uploadSourceImage, enqueueSnackbar, t]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    clearSourceImage();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenMaskEditor = () => {
    setMaskEditorOpen(true);
  };

  const handleCloseMaskEditor = () => {
    setMaskEditorOpen(false);
  };

  const handleApplyMask = (maskBase64: string) => {
    setMaskImageUrl(maskBase64);
    setMaskEditorOpen(false);
  };

  const handleClearMask = () => {
    clearMask();
  };

  // Result handlers
  const handleClearResult = () => {
    clearCurrentGeneration();
  };

  const handleUseMask = async () => {
    if (!currentGeneration?.generatedImageUrl) return;

    try {
      const base64 = await urlToBase64(currentGeneration.generatedImageUrl);
      setSourceImageUrl(base64);
      clearCurrentGeneration();
      setMaskEditorOpen(true);
    } catch {
      enqueueSnackbar(t('errors.generic'), { variant: 'error' });
    }
  };

  const handleDownload = () => {
    if (!currentGeneration?.generatedImageUrl) return;

    const link = document.createElement('a');
    link.href = currentGeneration.generatedImageUrl;
    link.download = `generated-${Date.now()}.png`;
    link.click();
  };

  // Check if we should show the generated result
  const showResult =
    currentGeneration?.status === 'COMPLETED' && currentGeneration.generatedImageUrl;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        {t('editor.imageUploader.label')}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
        {t('editor.imageUploader.hint')}
      </Typography>

      <Card
        onDrop={!showResult ? handleDrop : undefined}
        onDragOver={!showResult ? handleDragOver : undefined}
        onClick={!sourceImageUrl && !showResult ? handleClick : undefined}
        sx={{
          p: sourceImageUrl || showResult ? 0 : 3,
          cursor: sourceImageUrl || showResult ? 'default' : 'pointer',
          border: sourceImageUrl || showResult ? 'none' : '2px dashed',
          borderColor: sourceImageUrl || showResult ? 'transparent' : 'divider',
          bgcolor: 'background.neutral',
          transition: 'all 0.2s',
          position: 'relative',
          minHeight: sourceImageUrl || showResult ? 'auto' : 160,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          '&:hover':
            !sourceImageUrl && !showResult
              ? {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                }
              : {},
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />

        {showResult ? (
          <Box sx={{ position: 'relative', width: '100%' }}>
            <Box
              component="img"
              src={currentGeneration.generatedImageUrl}
              alt="Generated"
              sx={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />

            {/* Close button - top right */}
            <Box
              onClick={handleClearResult}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
              }}
            >
              <Iconify icon="mingcute:close-line" width={14} sx={{ color: 'white' }} />
            </Box>

            {/* Action buttons - bottom panel */}
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                p: 1.5,
                bgcolor: 'background.paper',
                borderTop: 1,
                borderColor: 'divider',
              }}
            >
              <Button
                variant="contained"
                size="small"
                startIcon={<Iconify icon="solar:pen-bold" width={18} />}
                onClick={handleUseMask}
                sx={{ flex: 1 }}
              >
                {t('editor.result.mask')}
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Iconify icon="solar:download-bold" width={18} />}
                onClick={handleDownload}
                sx={{ flex: 1 }}
              >
                {t('editor.result.download')}
              </Button>
            </Box>
          </Box>
        ) : isUploading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary">
              {t('editor.imageUploader.uploading')}
            </Typography>
          </Box>
        ) : sourceImageUrl ? (
          <Box sx={{ position: 'relative', width: '100%' }}>
            <Box
              component="img"
              src={sourceImageUrl}
              alt="Source"
              sx={{
                width: '100%',
                height: 'auto',
                borderRadius: 1.5,
                display: 'block',
              }}
            />

            {/* Mask preview overlay */}
            {maskImageUrl && (
              <MaskPreview
                maskUrl={maskImageUrl}
                onEdit={handleOpenMaskEditor}
                onClear={handleClearMask}
              />
            )}

            {/* Control buttons */}
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                display: 'flex',
                gap: 0.5,
              }}
            >
              {/* Mask editor button */}
              {!maskImageUrl && (
                <Box
                  onClick={handleOpenMaskEditor}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'primary.main' },
                  }}
                >
                  <Iconify icon="solar:pen-bold" width={16} sx={{ color: 'white' }} />
                </Box>
              )}

              {/* Remove image button */}
              <Box
                onClick={handleRemove}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: 'rgba(0,0,0,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                }}
              >
                <Iconify icon="mingcute:close-line" width={14} sx={{ color: 'white' }} />
              </Box>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Iconify icon="solar:camera-add-bold" width={48} sx={{ color: 'text.disabled' }} />
            <Typography variant="body2" color="text.secondary">
              {t('editor.imageUploader.dropzone')}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              JPG, PNG, WebP (max 10MB)
            </Typography>
          </Box>
        )}
      </Card>

      {/* Mask editor modal */}
      {sourceImageUrl && (
        <MaskEditorModal
          open={maskEditorOpen}
          imageUrl={sourceImageUrl}
          onClose={handleCloseMaskEditor}
          onApply={handleApplyMask}
        />
      )}
    </Box>
  );
}
