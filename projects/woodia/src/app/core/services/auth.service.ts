import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, catchError, throwError, firstValueFrom, BehaviorSubject, filter, take, switchMap, of } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '@woodia-environments/environment';
import { OAuthService } from 'angular-oauth2-oidc';

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

export type TUserType = 'Client' | 'MAKER'

export interface IUserData {
  id: string
  firstName: string
  lastName: string
  email: string
  userType: TUserType
}

export interface IEmailVerificationData {
  email: string;
  code: string
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private http: HttpClient,
    private router: Router,
    private oauthService: OAuthService,
  ) {
    // Initialize user from storage
    const storedUser = this.getStoredUser();
    this.user.set(storedUser);
  }

  readonly user = signal<IUserData | null>(null);

  readonly isAuthenticated = computed(() => {
    const user = this.user();
    if (!user) return false;

    return !!this.getToken() && !this.isAccessTokenExpired();
  });


  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<AuthResponse | null> = new BehaviorSubject<AuthResponse | null>(null);

  // Helpers
  storeUser(response: AuthResponse, rememberMe: boolean = true) {
    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem('auth_token', response.token);
    if (response.refreshToken) storage.setItem('refresh_token', response.refreshToken);
    if (response.refreshTokenExpiration) storage.setItem('refresh_token_expiration', response.refreshTokenExpiration);

    // Calculate the absolute expiration time (Current Time + ExpiresIn seconds)
    const expiresAt = Date.now() + (response.expiresIn * 60 * 1000);
    storage.setItem('expires_at', expiresAt.toString());

    const user = {
      id: response.id,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      userType: response.userType as TUserType,
    };

    storage.setItem('user', JSON.stringify(user));
    this.user.set(user);
  }


  /**
   * Google Login logic
   */
  async sendGoogleTokenToBackend(idToken: string): Promise<void> {
    return firstValueFrom(
      this.http.post<AuthResponse>(
        `${environment.apiUrl}${environment.endpoints.auth.googleSignIn}`,
        { idToken }
      )
    ).then(response => {
      this.storeUser(response);
    });
  }

  googleSignIn() {
    localStorage.setItem('google_auth_intent', JSON.stringify({ intent: 'login' }));
    this.oauthService.initLoginFlow()
  }

  googleSignUp(type: string) {
    localStorage.setItem('google_auth_intent', JSON.stringify({ intent: 'signup', type }));
    this.oauthService.initLoginFlow()
  }

  async sendGoogleSignUpTokenToBackend(idToken: string, userType: string): Promise<void> {
    return firstValueFrom(
      this.http.post<AuthResponse>(
        `${environment.apiUrl}${environment.endpoints.auth.googleSignUp}`,
        { idToken, userType }
      )
    ).then(response => {
      this.storeUser(response);
    });
  }

  async processGoogleLoginCallback(): Promise<AuthResponse | null> {
    if (!this.oauthService.hasValidIdToken()) return null;

    const idToken = this.oauthService.getIdToken();

    const response = await firstValueFrom(
      this.http.post<AuthResponse & { isNewUser?: boolean }>(
        `${environment.apiUrl}${environment.endpoints.auth.googleSignIn}`,
        { idToken }
      )
    );

    this.storeUser(response);

    return response;
  }

  get googleIdentityClaims() {
    return this.oauthService.getIdentityClaims()
  }

  get googleAccessToken() {
    return this.oauthService.getAccessToken()
  }

  get googleUserProfile() {
    const url = 'https://www.googleapis.com/oauth2/v2/userinfor'

    return this.http.get(url, {
      headers: {
        Authorization: `Bearer ${this.googleAccessToken}`
      }
    })
  }

  /**
   * Login user with credentials
   */
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
        this.storeUser(response, credentials.rememberMe);
      }),
      catchError(error => {
        console.error('Login failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Register new user
   */
  register(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${environment.apiUrl}${environment.endpoints.auth.register}`,
      userData,
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' })
      }
    ).pipe(
      catchError(error => {
        console.error('Registration failed:', error);
        return throwError(() => error);
      })
    );
  }


  /**
   * Confirm user email
  */

  confirmEmail(verificationData: IEmailVerificationData): any {
    return this.http.post<AuthResponse>(
      `${environment.apiUrl}${environment.endpoints.auth.confirmEmail}`,
      verificationData,
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' })
      }
    ).pipe(
      catchError(error => {
        console.error('Verification failed:', error);
        return throwError(() => error);
      })
    );
  }

  resendConfirmation(email: string): any {
    return this.http.post<AuthResponse>(
      `${environment.apiUrl}${environment.endpoints.auth.resendConfirmation}`,
      {
        email
      },
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' })
      }
    ).pipe(
      catchError(error => {
        console.error('Resending confirmation failed:', error);
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
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('expires_at');

    this.user.set(null);
    this.router.navigate(['/']);
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


  getCurrentUser(): IUserData | null {
    return this.user();
  }

  private getStoredUser(): IUserData | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');

    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
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
        this.storeUser(response);
        this.refreshTokenSubject.next(response);
      }),
      catchError(error => {
        this.isRefreshing = false;
        this.logout();
        console.log(error);
        return throwError(() => error);
      })
    );
  }
}
