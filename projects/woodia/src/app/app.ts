import { Component, OnInit, Renderer2, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ZardToastComponent } from '@shared-components/toast/toast.component';
import { AuthService } from './core/services/auth.service';
import { toast } from 'ngx-sonner';
import { timer } from 'rxjs';
import { OAuthService } from 'angular-oauth2-oidc';
import { authConfig } from './features/auth/google-auth.config';
import { ThemeService } from './core/services/theme.service';
import { LanguageService } from './core/services/language.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    ZardToastComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('woodia');
  private isProcessingToken = false;

  constructor(
    private renderer: Renderer2,
    private authService: AuthService,
    private oauthService: OAuthService,
    private router: Router,
    private themeService: ThemeService,
    private langService: LanguageService,
  ) { }

  async ngOnInit() {
    this.themeService.init()
    this.langService.init()

    this.oauthService.configure(authConfig);

    this.oauthService.events.subscribe(async (e) => {
      if (e.type === 'token_received') {
        this.processGoogleToken();
      } else if (e.type === 'token_error') {
        toast.error(this.langService.translate('features.auth.login.errors.authFailed'), {
          position: 'bottom-center'
        });
        localStorage.removeItem('google_auth_intent');
        this.router.navigate(['/auth/login']);
      }
    });

    await this.oauthService.loadDiscoveryDocument();

    const hash = window.location.hash;
    const search = window.location.search;

    if (hash.includes('error=') || search.includes('error=')) {
      toast.error(this.langService.translate('features.auth.login.errors.authCanceled'), {
        position: 'bottom-center'
      });
      localStorage.removeItem('google_auth_intent');
      this.router.navigate(['/auth/login']);
      return;
    }

    if (hash) {
      await this.oauthService.tryLogin({ customHashFragment: hash }).catch(() => { });
    } else {
      await this.oauthService.tryLogin().catch(() => { });
    }

    // Fallback if the event was already fired or missed
    if (this.oauthService.hasValidIdToken() && !this.authService.isAuthenticated()) {
      this.processGoogleToken();
    }

    if (this.authService.isAuthenticated()) {
      this.scheduleAutoRefresh();
    }
  }

  private async processGoogleToken() {
    if (this.isProcessingToken) return;
    this.isProcessingToken = true;

    try {
      const idToken = this.oauthService.getIdToken();
      if (idToken) {
        const intentStr = localStorage.getItem('google_auth_intent');
        let intentObj: { intent: string, type?: string } = { intent: 'login' };
        if (intentStr) {
          try {
            intentObj = JSON.parse(intentStr);
          } catch (e) { }
        }

        try {
          let isSignupSuccess = false;

          if (intentObj.intent === 'signup') {
            try {
              await this.authService.sendGoogleSignUpTokenToBackend(idToken, intentObj.type || 'Client');
              isSignupSuccess = true;
            } catch (signUpError: any) {
              console.log('Signup failed, attempting login...', signUpError);
              await this.authService.sendGoogleTokenToBackend(idToken);
            }
          } else {
            await this.authService.sendGoogleTokenToBackend(idToken);
          }

          const userType = this.authService.getCurrentUser()?.userType;

          if (userType?.toLowerCase() === 'admin') {
            this.authService.logout();
            this.oauthService.logOut();
            localStorage.removeItem('google_auth_intent');

            toast.error(this.langService.translate('features.auth.login.errors.accessDenied'), {
              position: 'bottom-center',
            });
            return;
          }

          if (isSignupSuccess) {
            toast.success(this.langService.translate('features.auth.register.messages.registrationSuccess'), {
              position: 'bottom-center',
              duration: 2000,
            });
          } else {
            toast.success(this.langService.translate('features.auth.login.messages.loginSuccess'), {
              position: 'bottom-center',
              duration: 2000,
            });
          }

          // Clear Google's session storage ID token so we don't trigger this infinitely on page reloads
          this.oauthService.logOut();
          localStorage.removeItem('google_auth_intent');

          if (userType === 'Client') {
            this.router.navigate(['/customers']);
          }
        } catch (error) {
          toast.error(this.langService.translate('features.auth.login.errors.googleAuthFailed'), {
            position: 'bottom-center',
          });
          console.error('Google Auth error', error);
        }
      }
    } finally {
      this.isProcessingToken = false;
    }
  }

  setGoogleSignInClientId(clientId: string): void {
    const metaTag = document.getElementById('google-signin-client-id') as HTMLMetaElement;
    if (metaTag) {
      this.renderer.setAttribute(metaTag, 'content', clientId);
    }
  }

  /**
   * Refresh token only if access token is expired or near expiry
   */
  tryRefreshTokenIfNeeded() {
    if (!this.authService.isAuthenticated()) return;

    if (this.authService.isAccessTokenExpired()) {
      this.authService.refreshToken()
        .subscribe({
          next: () => {
            console.log('Access token refreshed successfully');
          },
          error: (err) => {
            toast.error(this.langService.translate('features.auth.login.errors.sessionExpired'), {
              position: 'bottom-center',
            });
            console.log('Authentication failed: ', err);
            this.authService.logout();
          }
        });
    }
  }

  /**
   * Optional: auto-refresh token periodically before it expires
   */
  scheduleAutoRefresh() {
    if (!this.authService.isAuthenticated()) return;

    const expiresAt = this.authService.getAccessTokenExpiration();
    if (!expiresAt) return;

    const now = Date.now();
    // Refresh 1 minute before token expiry
    const refreshIn = expiresAt - now - 60_000;

    if (refreshIn <= 0) {
      this.tryRefreshTokenIfNeeded();
      return;
    }

    timer(refreshIn).subscribe(() => {
      this.tryRefreshTokenIfNeeded();
      this.scheduleAutoRefresh(); // schedule next refresh
    });
  }
}
