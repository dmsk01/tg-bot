import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

export interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
}

export const navConfig: NavItem[] = [
  {
    title: 'Dashboard',
    path: '/',
    icon: <DashboardIcon />,
  },
  {
    title: 'Users',
    path: '/users',
    icon: <PeopleIcon />,
  },
  {
    title: 'Promocodes',
    path: '/promocodes',
    icon: <LocalOfferIcon />,
  },
];
