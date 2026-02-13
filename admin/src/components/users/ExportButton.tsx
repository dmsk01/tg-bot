import { useState } from 'react';
import { Button, Menu, MenuItem, CircularProgress } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import type { ExportFormat } from '../../types';

interface ExportButtonProps {
  onExport: (format: ExportFormat) => Promise<void>;
  disabled?: boolean;
}

export default function ExportButton({ onExport, disabled }: ExportButtonProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExport = async (format: ExportFormat) => {
    setLoading(true);
    handleClose();
    try {
      await onExport(format);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={loading ? <CircularProgress size={16} /> : <DownloadIcon />}
        onClick={handleClick}
        disabled={disabled || loading}
      >
        Export
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={() => handleExport('csv')}>CSV</MenuItem>
        <MenuItem onClick={() => handleExport('xlsx')}>Excel (XLSX)</MenuItem>
      </Menu>
    </>
  );
}
