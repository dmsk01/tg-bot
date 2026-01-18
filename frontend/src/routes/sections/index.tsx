import type { RouteObject } from 'react-router';

import { lazy } from 'react';

// ----------------------------------------------------------------------

const EditorPage = lazy(() => import('src/pages/editor/editor-page').then(m => ({ default: m.EditorPage })));
const HistoryPage = lazy(() => import('src/pages/history/history-page').then(m => ({ default: m.HistoryPage })));
const BalancePage = lazy(() => import('src/pages/balance/balance-page').then(m => ({ default: m.BalancePage })));
const Page404 = lazy(() => import('src/pages/error/404'));

export const routesSection: RouteObject[] = [
  {
    path: '/',
    element: <EditorPage />,
  },
  {
    path: '/history',
    element: <HistoryPage />,
  },
  {
    path: '/balance',
    element: <BalancePage />,
  },
  // No match
  { path: '*', element: <Page404 /> },
];
