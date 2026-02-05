import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  MenuItem,
  Alert,
  FormControlLabel,
  Switch,
  Stack,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useStore } from '../../store/store';
import type { Dayjs } from 'dayjs';

interface CreateFormData {
  code?: string;
  type: 'FIXED_AMOUNT' | 'PERCENTAGE' | 'BONUS_CREDITS';
  value: number;
  maxUsages?: number;
  maxUsagesPerUser: number;
  description?: string;
}

export default function CreatePromocodePage() {
  const navigate = useNavigate();
  const createPromocode = useStore((state) => state.createPromocode);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Dayjs | null>(null);
  const [autoGenerate, setAutoGenerate] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CreateFormData>({
    defaultValues: {
      type: 'FIXED_AMOUNT',
      value: 10,
      maxUsagesPerUser: 1,
    },
  });

  const selectedType = watch('type');

  const onSubmit = async (data: CreateFormData) => {
    setError(null);
    setIsSubmitting(true);

    try {
      await createPromocode({
        code: autoGenerate ? undefined : data.code,
        type: data.type,
        value: data.value,
        maxUsages: data.maxUsages ? Number(data.maxUsages) : undefined,
        maxUsagesPerUser: data.maxUsagesPerUser,
        expiresAt: expiresAt?.toISOString(),
        description: data.description,
      });
      navigate('/promocodes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create promocode');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/promocodes')}
          sx={{ mb: 2 }}
        >
          Back to Promocodes
        </Button>

        <Typography variant="h4" gutterBottom>
          Create Promocode
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoGenerate}
                    onChange={(e) => setAutoGenerate(e.target.checked)}
                  />
                }
                label="Auto-generate code"
              />

              {!autoGenerate && (
                <TextField
                  {...register('code')}
                  label="Promocode"
                  fullWidth
                  placeholder="e.g., SUMMER2024"
                  helperText="Leave empty to auto-generate"
                />
              )}

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Type"
                      sx={{ minWidth: 200, flex: 1 }}
                      error={!!errors.type}
                      helperText={errors.type?.message}
                    >
                      <MenuItem value="FIXED_AMOUNT">Fixed Amount ($)</MenuItem>
                      <MenuItem value="PERCENTAGE">Percentage (%)</MenuItem>
                      <MenuItem value="BONUS_CREDITS">Bonus Credits</MenuItem>
                    </TextField>
                  )}
                />

                <TextField
                  {...register('value', { valueAsNumber: true })}
                  label={
                    selectedType === 'PERCENTAGE'
                      ? 'Percentage'
                      : selectedType === 'BONUS_CREDITS'
                      ? 'Credits'
                      : 'Amount ($)'
                  }
                  type="number"
                  sx={{ minWidth: 200, flex: 1 }}
                  error={!!errors.value}
                  helperText={errors.value?.message}
                  slotProps={{ htmlInput: { step: selectedType === 'PERCENTAGE' ? 1 : 0.01 } }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  {...register('maxUsages', { valueAsNumber: true })}
                  label="Max Total Usages"
                  type="number"
                  sx={{ minWidth: 200, flex: 1 }}
                  placeholder="Unlimited"
                  helperText="Leave empty for unlimited"
                />

                <TextField
                  {...register('maxUsagesPerUser', { valueAsNumber: true })}
                  label="Max Usages Per User"
                  type="number"
                  sx={{ minWidth: 200, flex: 1 }}
                  error={!!errors.maxUsagesPerUser}
                  helperText={errors.maxUsagesPerUser?.message}
                />
              </Box>

              <DatePicker
                label="Expires At"
                value={expiresAt}
                onChange={setExpiresAt}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    helperText: 'Leave empty for no expiration',
                  },
                }}
              />

              <TextField
                {...register('description')}
                label="Description"
                fullWidth
                multiline
                rows={2}
                placeholder="Internal notes about this promocode..."
              />

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button onClick={() => navigate('/promocodes')}>Cancel</Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Promocode'}
                </Button>
              </Box>
            </Stack>
          </form>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
}
