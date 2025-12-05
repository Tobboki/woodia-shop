import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { OAuthService } from 'angular-oauth2-oidc';
import { authConfig } from 'src/app/pages/auth/auth.config';

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
    this.oauthService.configure(authConfig);
    this.oauthService.loadDiscoveryDocumentAndTryLogin();

    this.oauthService.loadDiscoveryDocumentAndTryLogin().then(() => {
      if (this.oauthService.hasValidIdToken()) {
        this.sendGoogleTokenToBackend();
      }
    });

  }

  /**
   * Google Sign-In logic
   */

  async sendGoogleTokenToBackend() {
    const idToken = this.oauthService.getIdToken();
    const userType = 'Client';

    this.http.post<AuthResponse>(
      `${environment.apiUrl}${environment.endpoints.auth.googleSignIn}`,
      { idToken, userType }
    )
    .subscribe({
      next: (response) => {
        this.storeUser(response);
        console.log('tried', response)
      },
      error: (err) => console.error('Google login error:', err)
    });
  }

  storeUser(response: AuthResponse, rememberMe: boolean = true) {
    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem('auth_token', response.token);
    if (response.refreshToken) storage.setItem('refresh_token', response.refreshToken);
    if (response.refreshTokenExpiration) storage.setItem('refresh_token_expiration', response.refreshTokenExpiration);
    storage.setItem('expires_in', response.expiresIn.toString());

    const user = {
      id: response.id,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      userType: response.userType,
    };

    storage.setItem('user', JSON.stringify(user));

    this.router.navigate(['/']);
  }

  googleSignIn() {
    this.oauthService.initLoginFlow()

    this.sendGoogleTokenToBackend()
  }

  googleLogout() {
    this.oauthService.logOut()
  }

  // get googleIdentityClaims() {
  //   return this.oauthService.getIdentityClaims()
  // }

  // get googleAccessToken() {
  //   return this.oauthService.getAccessToken()
  // }

  // get googleUserProfile() {
  //   const url = 'https://www.googleapis.com/oauth2/v2/userinfor'

  //   return this.http.get(url, {
  //     headers: {
  //       Authorization: `Bearer ${this.googleAccessToken}`
  //     }
  //   })
  // }

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
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user');
    this.router.navigate(['/auth']);
  }

  /**
   * Get stored auth token
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }


  /**
   * Get current user from storage
   */
  getCurrentUser(): any {
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
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Refresh authentication token
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refresh_token') || 
                        sessionStorage.getItem('refresh_token');
    
    return this.http.post<AuthResponse>(
      `${environment.apiUrl}${environment.endpoints.auth.refreshToken}`,
      { refreshToken },
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' })
      }
    ).pipe(
      tap(response => {
        const storage = localStorage.getItem('auth_token') ? localStorage : sessionStorage;
        storage.setItem('auth_token', response.token);
      }),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }
}
