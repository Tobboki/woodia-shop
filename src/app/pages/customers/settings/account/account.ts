import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardDividerComponent } from '@shared/components/divider/divider.component';
import { ZardFormModule } from '@shared/components/form/form.module';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { CustomerSettingsService } from '@shared/services/customer-settings-service';
import { CdkContextMenuTrigger } from "@angular/cdk/menu";

@Component({
  selector: 'woodia-account',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ZardDividerComponent,
    ZardInputDirective,
    ZardFormModule,
    ZardButtonComponent,
    CdkContextMenuTrigger
],
  templateUrl: './account.html',
  styleUrl: './account.scss',
})
export class Account {
  constructor(private settingsService: CustomerSettingsService) {}

  infoForm = new FormGroup({
    firstName: new FormControl<string>('', [Validators.required]),
    lastName: new FormControl<string>('', [Validators.required]),
  });

  emailForm = new FormGroup({
    email: new FormControl<string>('', [Validators.required, Validators.email]),
  });

  passwordForm = new FormGroup({
    password: new FormControl<string>('', [
      Validators.required,
      Validators.minLength(8),
    ]),
  });

  // ===========================================================
  // INFO
  // ===========================================================
  handleInfoSubmit() {
    if (this.infoForm.invalid) {
      this.infoForm.markAllAsTouched();
      return;
    }

    const body = {
      firstName: this.infoForm.value.firstName,
      lastName: this.infoForm.value.lastName,
    };

    this.settingsService.updateInfo(body).subscribe({
      next: (res) => console.log('Info updated:', res),
      error: (err) => console.error('Update info error:', err),
    });
  }

  // ===========================================================
  // CHANGE EMAIL
  // ===========================================================
  handleEmailChange() {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    const body = {
      newEmail: this.emailForm.value.email,
    };

    if (typeof body === 'string') {
      this.settingsService.changeEmail(body).subscribe({
        next: (res) => console.log('Email change request sent:', res),
        error: (err) => console.error('Email change error:', err),
      });
    }
  }

  // ===========================================================
  // CHANGE PASSWORD (if your API has it)
  // ===========================================================
  handlePasswordChange() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const body = {
      password: this.passwordForm.value.password,
    };

    // If your API endpoint for password is /me/change-password
    // add it in your service then call it here
    console.log('Password change body:', body);
  }
}
