/** Public API hosts behind gateway HTTPS (port 443). Override with env. */

export const PAY_API_URL = (
  process.env.NEXT_PUBLIC_PAY_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://apiweb-payonmap.sabzevar.ir'
).replace(/\/$/, '');

/** MVC SSO portal (mvc-web-sso) */
export const SSO_WEB_URL = (
  process.env.NEXT_PUBLIC_SSO_WEB_URL || 'https://auth.sabzevar.ir'
).replace(/\/$/, '');

/** Post-login redirect registered in mvc-web-sso Frontend:AllowedCallbackUrls */
export const AUTH_CALLBACK_URL = (
  process.env.NEXT_PUBLIC_AUTH_CALLBACK_URL ||
  'https://map.sabzevar.ir/auth/callback'
).replace(/\/$/, '');

/** Login API — use same-origin `/sso-api` when Next/nginx proxy is enabled */
export const SSO_API_URL = (
  process.env.NEXT_PUBLIC_SSO_API_URL || '/sso-api'
).replace(/\/$/, '');

export const LAYERS_API_URL = (
  process.env.NEXT_PUBLIC_LAYERS_API_URL ||
  'https://apiweb-layersonmap.sabzevar.ir'
).replace(/\/$/, '');

export const LOCATIONS_API_URL = (
  process.env.NEXT_PUBLIC_LOCATIONS_API_URL ||
  'https://apiweb-locationsmap.sabzevar.ir'
).replace(/\/$/, '');
