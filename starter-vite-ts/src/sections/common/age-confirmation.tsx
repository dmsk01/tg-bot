import { useTranslation } from 'react-i18next';

import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContentText from '@mui/material/DialogContentText';

import { useStore } from 'src/store/store';

export function AgeConfirmation() {
  const { t } = useTranslation();
  const { confirmAge, setShowAgeConfirmModal, showAgeConfirmModal } = useStore();

  const handleConfirm = async () => {
    await confirmAge();
    setShowAgeConfirmModal(false);
  };

  return (
    <Dialog
      open={showAgeConfirmModal}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
        {t('ageConfirm.title')}
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ textAlign: 'center' }}>
          {t('ageConfirm.message')}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button variant="contained" size="large" onClick={handleConfirm}>
          {t('ageConfirm.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
