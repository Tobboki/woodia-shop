import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ZardButtonComponent } from '@shared-components/button/button.component';
import { ZardDialogRef } from '@shared-components/dialog/dialog.service';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'woodia-login-prompt-dialog',
  standalone: true,
  imports: [ZardButtonComponent, TranslocoDirective],
  template: `
    <div class="flex flex-col items-center text-center p-4" *transloco="let t">
      <div class="mb-6">
        <p class="font-body text-foreground-muted mb-6">
          {{ t('app.dialogs.loginPrompt.message') }}
        </p>
      </div>
      <div class="flex gap-4 w-full">
        <button
          z-button
          zType="outline"
          class="flex-1"
          (click)="close()"
        >
          {{ t('app.dialogs.loginPrompt.cancel') }}
        </button>
        <button
          z-button
          zType="default"
          class="flex-1"
          (click)="goToLogin()"
        >
          {{ t('app.dialogs.loginPrompt.login') }}
        </button>
      </div>
    </div>
  `,
})
export class LoginPromptDialog {
  private dialogRef = inject(ZardDialogRef<LoginPromptDialog>);
  private router = inject(Router);

  close() {
    this.dialogRef.close();
  }

  goToLogin() {
    const currentUrl = this.router.url;
    this.dialogRef.close();
    this.router.navigate(['/auth/login'], { queryParams: { returnUrl: currentUrl } });
  }

}
