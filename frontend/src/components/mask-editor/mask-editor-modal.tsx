import type { Point, DrawingTool, MaskEditorModalProps } from './types';

import { useTranslation } from 'react-i18next';
import { useRef, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { MaskCanvas } from './mask-canvas';
import { MaskToolbar } from './mask-toolbar';

export function MaskEditorModal({ open, imageUrl, onClose, onApply }: MaskEditorModalProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [tool, setTool] = useState<DrawingTool>('brush');
  const [brushSize, setBrushSize] = useState(30);
  const [lassoPoints, setLassoPoints] = useState<Point[]>([]);

  const handleReset = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setLassoPoints([]);
  }, []);

  const handleApply = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const maskBase64 = canvas.toDataURL('image/png');
    onApply(maskBase64);
  }, [onApply]);

  const handleCloseLasso = useCallback(() => {
    if (lassoPoints.length < 3) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
    lassoPoints.slice(1).forEach((point) => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.fill();

    setLassoPoints([]);
  }, [lassoPoints]);

  return (
    <Dialog fullScreen open={open} onClose={onClose}>
      {/* Header */}
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
            <Iconify icon="eva:arrowhead-left-fill" width={24} />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6">
            {t('maskEditor.title')}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Canvas area */}
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.900',
          overflow: 'hidden',
          p: 2,
        }}
      >
        <MaskCanvas
          imageUrl={imageUrl}
          tool={tool}
          brushSize={brushSize}
          canvasRef={canvasRef}
          containerRef={containerRef}
          lassoPoints={lassoPoints}
          onLassoPointsChange={setLassoPoints}
        />
      </Box>

      {/* Toolbar */}
      <MaskToolbar
        tool={tool}
        brushSize={brushSize}
        onToolChange={setTool}
        onBrushSizeChange={setBrushSize}
        onCloseLasso={handleCloseLasso}
        showCloseLasso={lassoPoints.length >= 3}
      />

      {/* Action buttons */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Button variant="outlined" color="inherit" onClick={handleReset} sx={{ flex: 1 }}>
          {t('maskEditor.reset')}
        </Button>
        <Button variant="outlined" color="inherit" onClick={onClose} sx={{ flex: 1 }}>
          {t('maskEditor.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleApply}
          sx={{ flex: 1 }}
          startIcon={<Iconify icon="solar:check-circle-bold" width={20} />}
        >
          {t('maskEditor.apply')}
        </Button>
      </Box>
    </Dialog>
  );
}
