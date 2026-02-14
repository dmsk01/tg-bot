# Mask Editor Component Design

## Overview

Component for selecting/drawing inpainting regions in the Telegram Mini App image editor. Users can draw masks using brush or lasso tools, which are then sent to Flux Fill Pro API for inpainting generation.

## Component Structure

```
frontend/src/components/mask-editor/
  mask-editor-modal.tsx    # Fullscreen modal dialog
  mask-canvas.tsx          # Canvas for drawing
  mask-toolbar.tsx         # Tool selection + brush size
  mask-preview.tsx         # Mask overlay on image preview
  use-mask-drawing.ts      # Drawing logic hook
  types.ts                 # TypeScript types
  index.ts                 # Exports
```

## Data Flow

1. `ImageUploader` shows lasso button when image is loaded
2. Click opens `MaskEditorModal`
3. User draws on `MaskCanvas`
4. "Apply" saves mask to store as base64
5. `MaskPreview` overlays on preview in `ImageUploader`
6. On generate, `maskImageUrl` is sent to API with `generationType: 'INPAINTING'`

## UI Layout (MaskEditorModal)

```
┌─────────────────────────────┐
│  ← Select Area              │  Header with back button
├─────────────────────────────┤
│                             │
│    ┌───────────────────┐    │
│    │                   │    │
│    │    Image          │    │  Canvas over image
│    │    + Canvas       │    │  (fit to screen, no zoom)
│    │                   │    │
│    └───────────────────┘    │
│                             │
├─────────────────────────────┤
│  [Brush] [Lasso]    ◯───●   │  Toolbar: tools + size slider
├─────────────────────────────┤
│  [Reset]  [Cancel]  [✓ OK]  │  Action buttons
└─────────────────────────────┘
```

- Fullscreen MUI Dialog (`fullScreen` prop)
- Image scaled to fit (object-fit: contain)
- Canvas same size, overlaid on image
- Touch events for mobile drawing

## Drawing Tools

### Brush
- `pointerdown` → start path
- `pointermove` → draw line (white color)
- `pointerup` → end path
- `lineCap: 'round'`, `lineJoin: 'round'` for smooth lines

### Lasso (Polygon)
- `click` → add point to array, draw line from previous
- Show points as small circles
- Double-click or click first point → close and fill polygon
- "Close" button in toolbar for mobile convenience

## Mask Generation for API

```typescript
const getMaskBase64 = (): string => {
  const offscreen = document.createElement('canvas');
  offscreen.width = originalImageWidth;
  offscreen.height = originalImageHeight;

  const ctx = offscreen.getContext('2d');
  ctx.fillStyle = 'black';        // Background = don't edit
  ctx.fillRect(0, 0, width, height);

  // Scale from visible canvas to original dimensions
  ctx.drawImage(visibleCanvas, 0, 0, originalWidth, originalHeight);

  return offscreen.toDataURL('image/png');
};
```

Output: Base64 PNG, black/white (white = edit area)

## Mask Preview (MaskPreview)

Displayed in ImageUploader when `maskImageUrl` exists:

- Semi-transparent overlay (blue/purple, opacity 0.35)
- CSS marching-ants animation for contour:
```css
@keyframes marching-ants {
  to { stroke-dashoffset: -12px; }
}
.mask-outline {
  stroke-dasharray: 6px;
  animation: marching-ants 0.4s linear infinite;
}
```

Control buttons on preview:
- Edit (pencil icon) → reopen editor
- Delete (trash icon) → clear mask

## Store Changes (generation.slice.ts)

```typescript
// State
maskImageUrl: string | null;

// Actions
setMaskImageUrl: (url: string | null) => void;
clearMask: () => void;
```

## API Integration

Existing backend already supports inpainting:
- `generationType: 'INPAINTING'`
- `maskImageUrl` parameter
- Uses `flux-fill-pro` model via Replicate

Logic for generation type selection:
```typescript
const getGenerationType = () => {
  if (sourceImageUrl && maskImageUrl) return 'INPAINTING';
  if (sourceImageUrl) return 'IMAGE_TO_IMAGE';
  return 'TEXT_TO_IMAGE';
};
```

## Behavior Notes

- Changing `sourceImageUrl` automatically clears mask
- Mask is tied to specific image
- Brush size: slider control (MVP, no eraser)
- No zoom/pan in first version
