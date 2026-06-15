// services/auth.service.ts

export interface UserInfo {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
}

export interface LoginInitiateResponse {
  loginUrl: string;
  state: string;
  stateExpiresIn: number;
}

export interface UserTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: UserInfo;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://apiweb-payonmap.sabzevar.ir:8446/api';

class AuthService {
  private accessToken: string | null = null;

  constructor() {
    // بازیابی توکن از localStorage در شروع
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
    }
  }

  /**
   * شروع فرآیند لاگین - دریافت آدرس صفحه SSO
   */
  async initiateLogin(): Promise<LoginInitiateResponse> {
    const response = await fetch(`${API_BASE_URL}/api/Auth/login`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('خطا در شروع فرآیند ورود');
    }

    return response.json();
  }

  /**
   * پردازش کالبک لاگین - بعد از بازگشت از SSO
   */
  async handleCallback(params: URLSearchParams): Promise<UserTokenResponse> {
    const token = params.get('token');
    const code = params.get('code');
    const state = params.get('state');
    const signature = params.get('signature');
    const timestamp = params.get('timestamp');

    // ساخت URL با پارامترهای دریافت شده
    const url = new URL(`${API_BASE_URL}/api/Auth/callback`);
    if (token) url.searchParams.append('token', token);
    if (code) url.searchParams.append('code', code);
    if (state) url.searchParams.append('state', state);
    if (signature) url.searchParams.append('signature', signature);
    if (timestamp) url.searchParams.append('timestamp', timestamp);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // برای دریافت Refresh Token Cookie
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'خطا در احراز هویت');
    }

    const data: UserTokenResponse = await response.json();
    
    // ذخیره Access Token در localStorage
    this.setAccessToken(data.accessToken);
    
    return data;
  }

  /**
   * تمدید Access Token با Refresh Token
   */
  async refreshToken(): Promise<string | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/Auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Refresh Token در Cookie ارسال می‌شود
      });

      if (!response.ok) {
        this.clearAccessToken();
        return null;
      }

      const data = await response.json();
      this.setAccessToken(data.accessToken);
      return data.accessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.clearAccessToken();
      return null;
    }
  }

  /**
   * دریافت اطلاعات کاربر جاری
   */
  async getCurrentUser(): Promise<UserInfo | null> {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/api/Auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // تلاش برای تمدید توکن
          const newToken = await this.refreshToken();
          if (newToken) {
            return this.getCurrentUser();
          }
        }
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * خروج از حساب کاربری
   */
  async logout(): Promise<void> {
    const token = this.getAccessToken();
    
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/Auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
      } catch (error) {
        console.error('Error during logout:', error);
      }
    }

    this.clearAccessToken();
  }

  /**
   * بررسی لاگین بودن کاربر
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    
    // بررسی انقضای توکن
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      return Date.now() < exp;
    } catch {
      return false;
    }
  }

  /**
   * دریافت Access Token جاری
   */
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  /**
   * تنظیم Access Token
   */
  private setAccessToken(token: string): void {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
    }
  }

  /**
   * پاک کردن Access Token
   */
  private clearAccessToken(): void {
    this.accessToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
    }
  }
}

export const authService = new AuthService();