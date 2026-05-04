import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Router} from '@angular/router';
import {catchError, Observable, tap, throwError, BehaviorSubject, filter, take} from 'rxjs';
import {environment} from '@admin-environments/environment';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  refreshTokenExpiration?: string;
  expiresIn: number;
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
}

export interface IUserData {
  id: string
  firstName: string
  lastName: string
  email: string
  userType: 'admin'
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private http: HttpClient,
    private router: Router,
  ) { }

  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<AuthResponse | null> = new BehaviorSubject<AuthResponse | null>(null);

  // Helpers
  storeUser(response: AuthResponse, rememberMe: boolean = true) {
    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem('auth_token', response.token);
    if (response.refreshToken) storage.setItem('refresh_token', response.refreshToken);
    if (response.refreshTokenExpiration) storage.setItem('refresh_token_expiration', response.refreshTokenExpiration);

    // Calculate the absolute expiration time (Current Time + ExpiresIn minutes)
    const expiresAt = Date.now() + (response.expiresIn * 60 * 1000);
    storage.setItem('expires_at', expiresAt.toString());

    const user = {
      id: response.id,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      userType: response.userType,
    };

    storage.setItem('user', JSON.stringify(user));
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !this.isAccessTokenExpired();
  }

  // Getters
  /**
   * Get current user from storage
   */
  getCurrentUser(): IUserData | null {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');

    if (!userStr) return null;

    try {
      // Parse the user data and return the updated structure
      const user = JSON.parse(userStr);
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
      };
    } catch (e) {
      console.error('Invalid user JSON in storage:', userStr);
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      return null;
    }
  }

  /**
   * Get stored access token
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  getExpirationDate(): string | Date | null {
    return localStorage.getItem('refresh_token_expiration')
  }

  getAccessTokenExpiration(): number | null {
    const exp =
      localStorage.getItem('expires_at') ||
      sessionStorage.getItem('expires_at');

    return exp ? Number(exp) : null;
  }

  isAccessTokenExpired(): boolean {
    const exp = this.getAccessTokenExpiration();
    if (!exp) return true;

    // refresh 1 minute early
    return Date.now() > exp - 60_000;
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
  }

  // Methods
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${environment.apiUrl}${environment.endpoints.auth.login}`,
      {
        email: credentials.email,
        password: credentials.password,
      },
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' })
      }
    ).pipe(
      tap(response => {
        console.log('Login response:', response);
        this.storeUser(response, credentials.rememberMe);
      }),
      catchError(error => {
        console.error('Login failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout user and clear storage
   */
  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('expires_at');
    localStorage.removeItem('refresh_token_expiration');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('expires_at');
    this.router.navigate(['/auth/login']);
  }

  /**
   * Refresh authentication token
   */
  refreshToken(): Observable<AuthResponse> {
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter(res => res !== null),
        take(1)
      ) as Observable<AuthResponse>;
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    const token = this.getToken()
    const refreshToken = this.getRefreshToken();

    return this.http.post<AuthResponse>(
      `${environment.apiUrl}${environment.endpoints.auth.refreshToken}`,
      {
        token,
        refreshToken
      },
    ).pipe(
      tap(response => {
        this.isRefreshing = false;
        console.log('Refresh response:', response);
        this.storeUser(response);
        this.refreshTokenSubject.next(response);
      }),
      catchError(error => {
        this.isRefreshing = false;
        this.logout();
        return throwError(() => error);
      })
    );
  }
}
