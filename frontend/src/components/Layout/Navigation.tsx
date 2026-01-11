import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function Navigation() {
  const { t } = useTranslation();

  return (
    <nav className="navigation">
      <NavLink
        to="/"
        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
      >
        {t('nav.editor')}
      </NavLink>
      <NavLink
        to="/history"
        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
      >
        {t('nav.history')}
      </NavLink>
      <NavLink
        to="/balance"
        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
      >
        {t('nav.balance')}
      </NavLink>
    </nav>
  );
}
