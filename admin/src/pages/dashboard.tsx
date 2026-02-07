import { Box, Typography, Card, CardContent } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { useAuth } from '../auth/context/auth-provider';

export default function DashboardPage() {
  const { admin } = useAuth();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Welcome back, {admin?.firstName || admin?.username}!
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Card sx={{ flex: '1 1 300px', maxWidth: 400 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h6">Users</Typography>
              <Typography variant="body2" color="text.secondary">
                Manage bot users
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: '1 1 300px', maxWidth: 400 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LocalOfferIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
            <Box>
              <Typography variant="h6">Promocodes</Typography>
              <Typography variant="body2" color="text.secondary">
                Create and manage promocodes
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
