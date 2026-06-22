import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, Observable, tap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { environment } from '@admin-environments/environment';

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
  isProfileComplete?: boolean;
}

export interface IUserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: 'admin';
  isProfileComplete?: boolean;
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
  private refreshTokenSubject = new BehaviorSubject<AuthResponse | null>(null);

  // ── Storage ──

  storeUser(response: AuthResponse, rememberMe = true): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('auth_token', response.token);
    if (response.refreshToken) storage.setItem('refresh_token', response.refreshToken);
    if (response.refreshTokenExpiration) storage.setItem('refresh_token_expiration', response.refreshTokenExpiration);
    const expiresAt = Date.now() + response.expiresIn * 60 * 1000;
    storage.setItem('expires_at', expiresAt.toString());
    storage.setItem('user', JSON.stringify({
      id: response.id,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      userType: response.userType,
      isProfileComplete: response.isProfileComplete,
    }));
  }

  // ── Getters ──

  isAuthenticated(): boolean {
    return !!this.getToken() && !this.isAccessTokenExpired();
  }

  getCurrentUser(): IUserData | null {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as IUserData;
    } catch {
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
  }

  getExpirationDate(): string | null {
    return localStorage.getItem('refresh_token_expiration');
  }

  getAccessTokenExpiration(): number | null {
    const exp = localStorage.getItem('expires_at') || sessionStorage.getItem('expires_at');
    return exp ? Number(exp) : null;
  }

  isAccessTokenExpired(): boolean {
    const exp = this.getAccessTokenExpiration();
    if (!exp) return true;
    return Date.now() > exp - 60_000; // refresh 1 min early
  }

  // ── Auth methods ──

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${environment.apiUrl}${environment.endpoints.auth.login}`,
      { email: credentials.email, password: credentials.password },
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
    ).pipe(
      tap(response => {
        // Store credentials first, then navigate so the auth guard
        // finds a valid token when the new route is activated.
        this.storeUser(response, credentials.rememberMe ?? true);
        this.router.navigate(['/']);
      }),
      catchError(error => {
        console.error('Login failed:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    ['auth_token', 'refresh_token', 'user', 'expires_at', 'refresh_token_expiration']
      .forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<AuthResponse> {
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter(res => res !== null),
        take(1)
      ) as Observable<AuthResponse>;
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    return this.http.post<AuthResponse>(
      `${environment.apiUrl}${environment.endpoints.auth.refreshToken}`,
      { token: this.getToken(), refreshToken: this.getRefreshToken() }
    ).pipe(
      tap(response => {
        this.isRefreshing = false;
        this.refreshTokenSubject.next(response);
        this.storeUser(response);
      }),
      catchError(error => {
        this.isRefreshing = false;
        this.logout();
        return throwError(() => error);
      })
    );
  }
}