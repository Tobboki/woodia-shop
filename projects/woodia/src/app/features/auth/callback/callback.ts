import { Component } from '@angular/core';
import { ZardLoaderComponent } from '@shared-components/loader/loader.component';
import { LogoComponent } from '@shared-components/custom/logo/logo.component';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-auth-callback',
  imports: [
    ZardLoaderComponent,
    LogoComponent,
    TranslocoDirective
  ],
  template: `
    <div class="flex flex-col items-center justify-center w-full h-screen gap-12" *transloco="let t">
      <logo [wText]="true" class="scale-150 animate-pulse" />
      
      <div class="flex flex-col justify-center items-center gap-6">
        <div class="relative w-20 h-20 flex justify-center items-center">
          <z-loader zSize="lg" class="text-primary" />
        </div>
        
        <div class="flex flex-col items-center gap-2 text-center">
          <h1 class="font-h1 text-foreground">
            {{ t('features.auth.callback.processing') }}
          </h1>
          <p class="font-body text-foreground-muted">
            {{ t('features.auth.callback.pleaseWait') }}
          </p>
        </div>
      </div>
    </div>
  `,
  standalone: true
})
export class Callback {
  // Processing logic is handled globally by app.ts subscribing to oauthService.events
}

