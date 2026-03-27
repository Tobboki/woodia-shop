import { Component, OnInit, Renderer2, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ZardToastComponent } from '@shared-components/toast/toast.component';
import { AuthService } from './core/services/auth.service';
import { toast } from 'ngx-sonner';
import { timer } from 'rxjs';
import { OAuthService } from 'angular-oauth2-oidc';
import { authConfig } from './features/auth/google-auth.config';
import {ThemeService} from './core/services/theme.service';
import {LanguageService} from './core/services/language.service';

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
      }
    });

    await this.oauthService.loadDiscoveryDocument();

    const hash = window.location.hash;
    if (hash) {
      await this.oauthService.tryLogin({ customHashFragment: hash });
    } else {
      await this.oauthService.tryLogin();
    }

    // Fallback if the event was already fired or missed
    if (this.oauthService.hasValidIdToken() && !this.authService.isAuthenticated()) {
      this.processGoogleToken();
    }
  }

  private async processGoogleToken() {
    const idToken = this.oauthService.getIdToken();
    if (idToken) {
      try {
        await this.authService.sendGoogleTokenToBackend(idToken);
        toast.success('Login Successful', {
          position: 'bottom-center',
          duration: 2000,
        });

        // Let's clear Google's session storage ID token so we don't trigger this infinitely on page reloads
        this.oauthService.logOut();

        if (this.authService.getCurrentUser()?.userType === 'Client') {
          this.router.navigate(['/customers']);
        }
      } catch (error) {
        toast.error('Google Sign-In failed', {
          description: 'There was a problem with your request.',
          position: 'bottom-center',
        });
        console.error('sendGoogleTokenToBackend error', error);
      }
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
            toast.error('Session expired', {
              description: 'Please login again to continue.',
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
