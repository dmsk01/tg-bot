import type { Point, DrawingTool } from './types';

import { useRef, useState, useEffect, useCallback } from 'react';

interface UseMaskDrawingProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  tool: DrawingTool;
  brushSize: number;
}

export function useMaskDrawing({ canvasRef, tool, brushSize }: UseMaskDrawingProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [lassoPoints, setLassoPoints] = useState<Point[]>([]);
  const lastPointRef = useRef<Point | null>(null);

  const getCanvasPoint = useCallback(
    (e: React.PointerEvent | React.MouseEvent): Point | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    [canvasRef]
  );

  const drawLine = useCallback(
    (from: Point, to: Point) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      ctx.strokeStyle = 'white';
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    },
    [canvasRef, brushSize]
  );

  const drawCircle = useCallback(
    (point: Point) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    },
    [canvasRef, brushSize]
  );

  const drawLassoPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || lassoPoints.length === 0) return;

    // Save current state
    ctx.save();

    // Draw lines between points
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    ctx.beginPath();
    ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
    lassoPoints.slice(1).forEach((point) => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();

    // Draw points
    ctx.setLineDash([]);
    lassoPoints.forEach((point, index) => {
      ctx.fillStyle = index === 0 ? '#4CAF50' : 'white';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    ctx.restore();
  }, [canvasRef, lassoPoints]);

  const fillLasso = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || lassoPoints.length < 3) return;

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
    lassoPoints.slice(1).forEach((point) => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.fill();

    setLassoPoints([]);
  }, [canvasRef, lassoPoints]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (tool !== 'brush') return;

      const point = getCanvasPoint(e);
      if (!point) return;

      setIsDrawing(true);
      lastPointRef.current = point;
      drawCircle(point);
    },
    [tool, getCanvasPoint, drawCircle]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (tool !== 'brush' || !isDrawing) return;

      const point = getCanvasPoint(e);
      if (!point || !lastPointRef.current) return;

      drawLine(lastPointRef.current, point);
      lastPointRef.current = point;
    },
    [tool, isDrawing, getCanvasPoint, drawLine]
  );

  const handlePointerUp = useCallback(() => {
    if (tool !== 'brush') return;
    setIsDrawing(false);
    lastPointRef.current = null;
  }, [tool]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (tool !== 'lasso') return;

      const point = getCanvasPoint(e);
      if (!point) return;

      // Check if clicking on first point to close
      if (lassoPoints.length >= 3) {
        const firstPoint = lassoPoints[0];
        const distance = Math.sqrt(
          Math.pow(point.x - firstPoint.x, 2) + Math.pow(point.y - firstPoint.y, 2)
        );
        if (distance < 15) {
          fillLasso();
          return;
        }
      }

      setLassoPoints((prev) => [...prev, point]);
    },
    [tool, getCanvasPoint, lassoPoints, fillLasso]
  );

  const handleDoubleClick = useCallback(() => {
    if (tool !== 'lasso' || lassoPoints.length < 3) return;
    fillLasso();
  }, [tool, lassoPoints, fillLasso]);

  const closeLasso = useCallback(() => {
    if (lassoPoints.length >= 3) {
      fillLasso();
    }
  }, [lassoPoints, fillLasso]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setLassoPoints([]);
  }, [canvasRef]);

  // Redraw lasso preview when points change
  useEffect(() => {
    if (tool === 'lasso' && lassoPoints.length > 0) {
      // We need to redraw preview on a separate layer or handle differently
      // For now, the preview is drawn directly
    }
  }, [tool, lassoPoints, drawLassoPreview]);

  return {
    isDrawing,
    lassoPoints,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleClick,
    handleDoubleClick,
    closeLasso,
    clearCanvas,
    drawLassoPreview,
  };
}
