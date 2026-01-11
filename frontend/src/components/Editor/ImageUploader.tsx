import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store/store';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ImageUploader() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sourceImageUrl = useStore((state) => state.sourceImageUrl);
  const isUploading = useStore((state) => state.isUploading);
  const uploadSourceImage = useStore((state) => state.uploadSourceImage);
  const clearSourceImage = useStore((state) => state.clearSourceImage);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return t('editor.imageUploader.invalidType');
    }
    if (file.size > MAX_FILE_SIZE) {
      return t('editor.imageUploader.fileTooLarge');
    }
    return null;
  };

  const handleFileSelect = useCallback(
    async (file: File) => {
      const error = validateFile(file);
      if (error) {
        alert(error);
        return;
      }
      await uploadSourceImage(file);
    },
    [uploadSourceImage]
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

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearSourceImage();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="editor-section">
      <label className="editor-label">{t('editor.imageUploader.label')}</label>
      <p className="editor-hint">{t('editor.imageUploader.hint')}</p>

      <div
        className={`image-uploader ${sourceImageUrl ? 'has-image' : ''} ${isUploading ? 'uploading' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={!sourceImageUrl ? handleClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleInputChange}
          className="hidden-input"
        />

        {isUploading ? (
          <div className="upload-loading">
            <div className="spinner" />
            <span>{t('editor.imageUploader.uploading')}</span>
          </div>
        ) : sourceImageUrl ? (
          <div className="image-preview">
            <img src={sourceImageUrl} alt="Source" />
            <button className="remove-btn" onClick={handleRemove} title={t('editor.imageUploader.remove')}>
              ✕
            </button>
          </div>
        ) : (
          <div className="upload-placeholder">
            <div className="upload-icon">📷</div>
            <span>{t('editor.imageUploader.dropzone')}</span>
            <span className="upload-formats">JPG, PNG, WebP (max 10MB)</span>
          </div>
        )}
      </div>
    </div>
  );
}
