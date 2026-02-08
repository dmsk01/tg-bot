import { paths } from 'src/routes/paths';

import packageJson from '../package.json';

// ----------------------------------------------------------------------

export type ConfigValue = {
  appName: string;
  appVersion: string;
  serverUrl: string;
  assetsDir: string;
  auth: {
    method: 'jwt' | 'amplify' | 'firebase' | 'supabase' | 'auth0';
    skip: boolean;
    redirectPath: string;
  };
};

// ----------------------------------------------------------------------

function getServerUrl(): string {
  const url = import.meta.env.VITE_API_URL;

  // In production, VITE_API_URL must be set and use HTTPS
  if (import.meta.env.PROD) {
    if (!url) {
      throw new Error('VITE_API_URL environment variable is required in production');
    }
    if (!url.startsWith('https://')) {
      throw new Error('VITE_API_URL must use HTTPS in production');
    }
    return url;
  }

  // In development, allow HTTP localhost fallback
  return url ?? 'http://localhost:3000';
}

export const CONFIG: ConfigValue = {
  appName: 'Postcard Bot',
  appVersion: packageJson.version,
  serverUrl: getServerUrl(),
  assetsDir: import.meta.env.VITE_ASSETS_DIR ?? '',
  auth: {
    method: 'jwt',
    skip: true,
    redirectPath: paths.root,
  },
};
