export type DrawingTool = 'brush' | 'lasso';

export interface Point {
  x: number;
  y: number;
}

export interface MaskEditorModalProps {
  open: boolean;
  imageUrl: string;
  onClose: () => void;
  onApply: (maskBase64: string) => void;
}

export interface MaskCanvasProps {
  imageUrl: string;
  tool: DrawingTool;
  brushSize: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export interface MaskToolbarProps {
  tool: DrawingTool;
  brushSize: number;
  onToolChange: (tool: DrawingTool) => void;
  onBrushSizeChange: (size: number) => void;
  onCloseLasso: () => void;
  showCloseLasso: boolean;
}

export interface MaskPreviewProps {
  maskUrl: string;
  onEdit: () => void;
  onClear: () => void;
}
