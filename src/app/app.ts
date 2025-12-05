import { Component, inject, OnInit, Renderer2, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ZardToastComponent } from '@shared/components/toast/toast.component';
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
  ) {}

  ngOnInit(): void {
    this.setGoogleSignInClientId(environment.googleSignInClientId);
  }

  setGoogleSignInClientId(clientId: string): void {
    const metaTag = document.getElementById('google-signin-client-id') as HTMLMetaElement;
    if (metaTag) {
      this.renderer.setAttribute(metaTag, 'content', clientId);
    }
  }
}
