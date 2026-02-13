import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { AuthGuard } from '../auth/guard/auth-guard';
import { GuestGuard } from '../auth/guard/guest-guard';
import DashboardLayout from '../layouts/dashboard/layout';

const Loading = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

// Lazy load pages
const LoginPage = lazy(() => import('../pages/login'));
const DashboardPage = lazy(() => import('../pages/dashboard'));
const UsersListPage = lazy(() => import('../pages/users/list'));
const UserDetailPage = lazy(() => import('../pages/users/detail'));
const PromocodesListPage = lazy(() => import('../pages/promocodes/list'));
const CreatePromocodePage = lazy(() => import('../pages/promocodes/create'));

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <GuestGuard>
        <Suspense fallback={<Loading />}>
          <LoginPage />
        </Suspense>
      </GuestGuard>
    ),
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <DashboardLayout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<Loading />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'users',
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<Loading />}>
                <UsersListPage />
              </Suspense>
            ),
          },
          {
            path: ':id',
            element: (
              <Suspense fallback={<Loading />}>
                <UserDetailPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: 'promocodes',
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<Loading />}>
                <PromocodesListPage />
              </Suspense>
            ),
          },
          {
            path: 'create',
            element: (
              <Suspense fallback={<Loading />}>
                <CreatePromocodePage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
