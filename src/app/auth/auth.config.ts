// src/app/auth/auth.config.ts
import { environment } from './../../environments/environment';

interface AuthConfig {
  CLIENT_ID: string;
  CLIENT_DOMAIN: string;
  AUDIENCE: string;
  REDIRECT: string;
  SCOPE: string;
  NAMESPACE: string;
};

export const AUTH_CONFIG: AuthConfig = {
  CLIENT_ID: 'i2hAayrg7ZuV8PTQRQqL3XVKFupx4PM0',
  CLIENT_DOMAIN: 'actuarialgames.auth0.com', // e.g., you.auth0.com
  AUDIENCE: 'https://actuarialgames.auth0.com/api/v2/', // e.g., http://localhost:8083/api/
  REDIRECT: `${environment.BASE_URI}/callback`,
  SCOPE: 'openid profile', 
  NAMESPACE: 'https://test-heroku-jmhans33439.codeanyapp.com/roles'
};