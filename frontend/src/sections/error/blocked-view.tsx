import { m } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { ForbiddenIllustration } from 'src/assets/illustrations';

import { varBounce, MotionContainer } from 'src/components/animate';

// ----------------------------------------------------------------------

const SUPPORT_USERNAME = 'support_bot';

export function BlockedView() {
  const { t } = useTranslation();

  const handleContactSupport = () => {
    window.open(`https://t.me/${SUPPORT_USERNAME}`, '_blank');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        px: 2,
      }}
    >
      <Container component={MotionContainer} maxWidth="sm">
        <m.div variants={varBounce('in')}>
          <Typography variant="h3" sx={{ mb: 2, textAlign: 'center' }}>
            {t('blocked.title')}
          </Typography>
        </m.div>

        <m.div variants={varBounce('in')}>
          <Typography sx={{ color: 'text.secondary', textAlign: 'center' }}>
            {t('blocked.message')}
          </Typography>
        </m.div>

        <m.div variants={varBounce('in')}>
          <ForbiddenIllustration sx={{ my: { xs: 5, sm: 8 }, mx: 'auto' }} />
        </m.div>

        <m.div variants={varBounce('in')}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              size="large"
              variant="contained"
              onClick={handleContactSupport}
            >
              {t('blocked.support')}
            </Button>
          </Box>
        </m.div>
      </Container>
    </Box>
  );
}
