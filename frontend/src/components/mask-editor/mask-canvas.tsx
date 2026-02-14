import type { Point, MaskCanvasProps } from './types';

import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';

interface MaskCanvasInternalProps extends MaskCanvasProps {
  onLassoPointsChange: (points: Point[]) => void;
  lassoPoints: Point[];
}

export function MaskCanvas({
  imageUrl,
  tool,
  brushSize,
  canvasRef,
  containerRef,
  onLassoPointsChange,
  lassoPoints,
}: MaskCanvasInternalProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);

  // Load image and set dimensions
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);

      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      const imageAspect = img.width / img.height;
      const containerAspect = containerWidth / containerHeight;

      let displayWidth: number;
      let displayHeight: number;

      if (imageAspect > containerAspect) {
        displayWidth = containerWidth;
        displayHeight = containerWidth / imageAspect;
      } else {
        displayHeight = containerHeight;
        displayWidth = containerHeight * imageAspect;
      }

      setDimensions({ width: displayWidth, height: displayHeight });

      // Initialize canvas
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'black';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    };
    img.src = imageUrl;
  }, [imageUrl, containerRef, canvasRef]);

  const getCanvasPoint = (e: React.PointerEvent | React.MouseEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const drawBrushStroke = (from: Point, to: Point) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const scaledBrushSize = brushSize * (canvas!.width / dimensions.width);

    ctx.strokeStyle = 'white';
    ctx.lineWidth = scaledBrushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const drawBrushDot = (point: Point) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const scaledBrushSize = brushSize * (canvas.width / dimensions.width);

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(point.x, point.y, scaledBrushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const fillLassoPolygon = (points: Point[]) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || points.length < 3) return;

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.fill();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (tool !== 'brush') return;

    const point = getCanvasPoint(e);
    if (!point) return;

    isDrawingRef.current = true;
    lastPointRef.current = point;
    drawBrushDot(point);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (tool !== 'brush' || !isDrawingRef.current) return;

    const point = getCanvasPoint(e);
    if (!point || !lastPointRef.current) return;

    drawBrushStroke(lastPointRef.current, point);
    lastPointRef.current = point;
  };

  const handlePointerUp = () => {
    if (tool !== 'brush') return;
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (tool !== 'lasso') return;

    const point = getCanvasPoint(e);
    if (!point) return;

    // Check if clicking on first point to close
    if (lassoPoints.length >= 3) {
      const firstPoint = lassoPoints[0];
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const threshold = 20 * scaleX;
        const distance = Math.sqrt(
          Math.pow(point.x - firstPoint.x, 2) + Math.pow(point.y - firstPoint.y, 2)
        );
        if (distance < threshold) {
          fillLassoPolygon(lassoPoints);
          onLassoPointsChange([]);
          return;
        }
      }
    }

    onLassoPointsChange([...lassoPoints, point]);
  };

  const handleDoubleClick = () => {
    if (tool !== 'lasso' || lassoPoints.length < 3) return;
    fillLassoPolygon(lassoPoints);
    onLassoPointsChange([]);
  };

  // Draw lasso preview overlay
  const renderLassoPreview = () => {
    if (tool !== 'lasso' || lassoPoints.length === 0 || !dimensions.width) return null;

    const canvas = canvasRef.current;
    if (!canvas) return null;

    const scaleX = dimensions.width / canvas.width;
    const scaleY = dimensions.height / canvas.height;

    const scaledPoints = lassoPoints.map((p) => ({
      x: p.x * scaleX,
      y: p.y * scaleY,
    }));

    return (
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: dimensions.width,
          height: dimensions.height,
          pointerEvents: 'none',
        }}
      >
        {/* Lines between points */}
        {scaledPoints.length > 1 && (
          <polyline
            points={scaledPoints.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        )}
        {/* Points */}
        {scaledPoints.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={index === 0 ? 8 : 6}
            fill={index === 0 ? '#4CAF50' : 'white'}
            stroke="rgba(0,0,0,0.5)"
            strokeWidth="2"
          />
        ))}
      </svg>
    );
  };

  if (!imageLoaded) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Loading...
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: dimensions.width,
        height: dimensions.height,
        mx: 'auto',
      }}
    >
      {/* Background image */}
      <Box
        component="img"
        src={imageUrl}
        alt="Source"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          pointerEvents: 'none',
        }}
      />

      {/* Drawing canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.5,
          cursor: tool === 'brush' ? 'crosshair' : 'pointer',
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      />

      {/* Lasso preview */}
      {renderLassoPreview()}
    </Box>
  );
}
