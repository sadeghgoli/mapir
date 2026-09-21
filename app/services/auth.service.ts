// services/auth.service.ts — legacy wrapper; prefer AuthContext for UI.

import {
  AUTH_CALLBACK_URL,
  SSO_API_URL,
  SSO_WEB_URL,
} from '@/app/utils/apiConfig';
import { fetchSsoMe, mapSsoMeToUser, type MapAuthUser } from '@/app/utils/ssoAuth';

export type UserInfo = MapAuthUser;

export interface LoginInitiateResponse {
  loginUrl: string;
}

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';

class AuthService {
  /**
   * Redirect URL for MVC SSO portal (no pay-api broker).
   */
  getPortalLoginUrl(): string {
    const url = new URL(`${SSO_WEB_URL}/Account/Login`);
    url.searchParams.set('returnUrl', AUTH_CALLBACK_URL);
    return url.toString();
  }

  async initiateLogin(): Promise<LoginInitiateResponse> {
    return { loginUrl: this.getPortalLoginUrl() };
  }

  /**
   * After portal redirect with ?token= on /auth/callback.
   */
  async handleCallback(params: URLSearchParams): Promise<{ accessToken: string; user: UserInfo }> {
    const token = params.get('token');
    if (!token) {
      throw new Error('توکن ورود یافت نشد');
    }

    const accessToken = decodeURIComponent(token);
    const refreshToken = params.get('refreshToken');
    const { user } = await fetchSsoMe(accessToken);
    if (!user) {
      throw new Error('توکن دریافتی معتبر نیست');
    }

    this.setAccessToken(accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, decodeURIComponent(refreshToken));
    }
    localStorage.setItem('user', JSON.stringify(user));

    return { accessToken, user };
  }

  async refreshToken(): Promise<string | null> {
    const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refresh) return null;

    try {
      const response = await fetch(`${SSO_API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      });

      if (!response.ok) {
        this.clearAccessToken();
        return null;
      }

      const json = await response.json();
      const data = json.data ?? json;
      if (!data.accessToken) {
        this.clearAccessToken();
        return null;
      }

      this.setAccessToken(data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      }
      return data.accessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.clearAccessToken();
      return null;
    }
  }

  async getCurrentUser(): Promise<UserInfo | null> {
    const token = this.getAccessToken();
    if (!token) return null;

    const { user } = await fetchSsoMe(token);
    if (user) return user;

    const newToken = await this.refreshToken();
    if (!newToken) return null;

    const retry = await fetchSsoMe(newToken);
    return retry.user;
  }

  async logout(): Promise<void> {
    const token = this.getAccessToken();

    if (token) {
      try {
        await fetch(`${SSO_API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Error during logout:', error);
      }
    }

    this.clearAccessToken();
    localStorage.removeItem('user');
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      return Date.now() < exp;
    } catch {
      return false;
    }
  }

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('accessToken');
  }

  private setAccessToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem('accessToken');
    }
  }

  private clearAccessToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('accessToken');
    }
  }
}

export const authService = new AuthService();
