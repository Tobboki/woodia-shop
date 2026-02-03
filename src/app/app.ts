import { Component, inject, OnInit, Renderer2, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ZardToastComponent } from '@shared/components/toast/toast.component';
import { AuthService } from '@shared/services/auth';
import { toast } from 'ngx-sonner';
import { environment } from 'src/environments/environment';
import { timer } from 'rxjs';

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
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.setGoogleSignInClientId(environment.googleSignInClientId);
    this.tryRefreshTokenIfNeeded();
    this.scheduleAutoRefresh();
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
