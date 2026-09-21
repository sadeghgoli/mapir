import { SSO_API_URL } from '@/app/utils/apiConfig';

export interface MapAuthUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
}

type SsoMePayload = {
  id?: string;
  melliCode?: string;
  phone?: string | null;
  name?: string;
  email?: string;
  avatar?: string;
};

export function mapSsoMeToUser(data: SsoMePayload): MapAuthUser | null {
  if (!data.id) return null;

  const phone = (data.phone ?? '').trim();
  const name =
    (data.name ?? '').trim() ||
    phone ||
    (data.melliCode ?? '').trim() ||
    'کاربر';

  return {
    id: data.id,
    name,
    phone: phone || (data.melliCode ?? '').trim(),
    email: data.email,
    avatar: data.avatar,
  };
}

function unwrapMePayload(json: unknown): SsoMePayload | null {
  if (!json || typeof json !== 'object') return null;
  const record = json as Record<string, unknown>;
  const data = record.data;
  if (data && typeof data === 'object') return data as SsoMePayload;
  return record as SsoMePayload;
}

export async function fetchSsoMe(accessToken: string): Promise<{
  user: MapAuthUser | null;
  permissions: string[];
  roles: string[];
}> {
  try {
    const response = await fetch(`${SSO_API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { user: null, permissions: [], roles: [] };
    }

    const json = await response.json();
    const payload = unwrapMePayload(json);
    const user = payload ? mapSsoMeToUser(payload) : null;

    return { user, permissions: [], roles: [] };
  } catch (error) {
    console.error('Error fetching SSO user info:', error);
    return { user: null, permissions: [], roles: [] };
  }
}

export function parseClaimsFromToken(token: string): {
  permissions: string[];
  roles: string[];
} {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const permissions: string[] = [];
    const roles: string[] = [];
    for (const key in payload) {
      const val = payload[key];
      if (key === 'permission') {
        if (Array.isArray(val)) permissions.push(...val);
        else if (val) permissions.push(String(val));
      }
      if (key === 'role') {
        if (Array.isArray(val)) roles.push(...val);
        else if (val) roles.push(String(val));
      }
    }
    return { permissions, roles };
  } catch {
    return { permissions: [], roles: [] };
  }
}
