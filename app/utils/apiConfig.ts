/** Public API hosts behind gateway HTTPS (port 443). Override with env. */

export const PAY_API_URL = (
  process.env.NEXT_PUBLIC_PAY_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://apiweb-payonmap.sabzevar.ir'
).replace(/\/$/, '');

export const SSO_API_URL = (
  process.env.NEXT_PUBLIC_SSO_API_URL ||
  'https://apiweb-loginsso.sabzevar.ir'
).replace(/\/$/, '');

export const LAYERS_API_URL = (
  process.env.NEXT_PUBLIC_LAYERS_API_URL ||
  'https://apiweb-layersonmap.sabzevar.ir'
).replace(/\/$/, '');

export const LOCATIONS_API_URL = (
  process.env.NEXT_PUBLIC_LOCATIONS_API_URL ||
  'https://apiweb-locationsmap.sabzevar.ir'
).replace(/\/$/, '');
