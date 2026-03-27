import { Component } from '@angular/core';

@Component({
  selector: 'app-auth-callback',
  imports: [],
  template: `
    <div class="flex items-center justify-center w-full h-screen">
      <div class="flex flex-col items-center gap-[16px]">
        <h3 class="font-h3 text-foreground/50">Completing Sign-In...</h3>
        <!-- Simple spinner inline -->
        <div class="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    </div>
  `,
  standalone: true
})
export class Callback {
  // Processing logic is handled globally by app.ts subscribing to oauthService.events
}
