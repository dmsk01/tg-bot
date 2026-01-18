import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { useColorScheme } from '@mui/material/styles';

import { useStore } from 'src/store/store';
import { LanguagePopover } from 'src/layouts/components/language-popover';

import { Iconify } from 'src/components/iconify';

export function Header() {
  const { t, i18n } = useTranslation();
  const { user, updateLanguage } = useStore();
  const { mode, setMode } = useColorScheme();

  const handleChangeLang = async (lang: string) => {
    await i18n.changeLanguage(lang);
    await updateLanguage(lang);
  };

  const handleToggleTheme = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: 1,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight="bold">
          {t('app.title')}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <LanguagePopover
            data={[
              { value: 'ru', label: 'Русский', countryCode: 'RU' },
              { value: 'en', label: 'English', countryCode: 'GB' },
            ]}
            currentLang={i18n.language}
            onChangeLang={handleChangeLang}
          />

          <IconButton
            onClick={handleToggleTheme}
            sx={{ width: 40, height: 40 }}
            aria-label={t('settings.theme')}
          >
            <Iconify
              icon={mode === 'dark' ? 'solar:sun-bold' : 'solar:moon-bold'}
              width={24}
            />
          </IconButton>

          {user && (
            <Chip
              label={t('balance.amount', { amount: user.balance.toFixed(2) })}
              color="primary"
              variant="outlined"
              size="small"
            />
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
