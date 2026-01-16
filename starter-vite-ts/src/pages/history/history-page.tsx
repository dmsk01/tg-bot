import type { AspectRatio } from 'src/types';

import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import CardMedia from '@mui/material/CardMedia';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';

import { useStore } from 'src/store/store';

export function HistoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { generations, fetchHistory, setPrompt, setSelectedModel, setAspectRatio } = useStore();

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleRepeat = (generation: (typeof generations)[0]) => {
    setPrompt(generation.prompt);
    setSelectedModel(generation.model);
    setAspectRatio(generation.aspectRatio as AspectRatio);
    navigate('/');
  };

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        {t('history.title')}
      </Typography>

      {generations.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            color: 'text.secondary',
          }}
        >
          <Typography variant="body1">{t('history.empty')}</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {generations.map((generation) => (
            <Grid key={generation.id} size={{ xs: 12, sm: 6 }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {generation.generatedImageUrl && (
                  <CardMedia
                    component="img"
                    image={generation.generatedImageUrl}
                    alt={generation.prompt}
                    sx={{ height: 160, objectFit: 'cover' }}
                  />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      mb: 1,
                    }}
                  >
                    {generation.prompt}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    <Chip size="small" label={generation.model} />
                    <Chip size="small" label={generation.aspectRatio} variant="outlined" />
                    <Chip
                      size="small"
                      label={generation.status}
                      color={generation.status === 'COMPLETED' ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => handleRepeat(generation)}>
                    {t('history.repeat')}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
