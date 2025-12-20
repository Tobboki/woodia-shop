import { Component, inject, OnInit, Renderer2, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ZardToastComponent } from '@shared/components/toast/toast.component';
import { AuthService } from '@shared/services/auth';
import { toast } from 'ngx-sonner';
import { environment } from 'src/environments/environment';
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
    this.refreshTokens()
  }

  setGoogleSignInClientId(clientId: string): void {
    const metaTag = document.getElementById('google-signin-client-id') as HTMLMetaElement;
    if (metaTag) {
      this.renderer.setAttribute(metaTag, 'content', clientId);
    }
  }

  refreshTokens() {
    if (!this.authService.isAuthenticated()) return

    this.authService.refreshToken()
      .subscribe({
        error: (err) => {
          toast.error('Something went wrong', {
            description: 'There was a problem with your authentication. please login again.',
            position: 'bottom-center',
          });
          console.log('Authentication failed: ', err)
          this.authService.logout()
        }
      });
  }
}
