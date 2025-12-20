import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ZardAvatarComponent } from '@shared/components/avatar/avatar.component';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardDialogComponent } from '@shared/components/dialog/dialog.component';
import { Z_MODAL_DATA, ZardDialogService } from '@shared/components/dialog/dialog.service';
import { ZardDividerComponent } from '@shared/components/divider/divider.component';
import { ZardFormModule } from '@shared/components/form/form.module';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import { ZardInputGroupComponent } from '@shared/components/input-group/input-group.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { AuthService } from '@shared/services/auth';
import { CustomerSettingsService } from '@shared/services/customer-settings-service';
import { toast } from 'ngx-sonner';

interface IVerifyEmailChangeData {
  email: string;
}

interface IEmailVerificationData {
  email: string
  code: string
}

interface IUserData {
  firstName: string
  lastName: string
  email: string
}
@Component({
  selector: 'verify-email-change-dialog',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ZardInputDirective,
    ZardFormModule,
    ZardButtonComponent,
  ],
  standalone: true,
  template: `
    <form [formGroup]="verifyEmailChangeForm" (ngSubmit)="handleVerificationSubmit()" class="space-y-6 my-[40px]">
      <z-form-field>
        <label class="font-label" z-form-label zRequired>
          Code
        </label>
        <z-form-control>
          <input
            z-input
            type="text"
            placeholder="max 6 chars or digits"
            formControlName="code"
          />
        </z-form-control>
      </z-form-field>

      <button
        zFull
        z-button
        zType="default"
        type="submit"
        [disabled]="verifyEmailChangeForm.invalid"
        [zLoading]="codeVerificationLoading()"
      >
        Verify Account
      </button>
    </form>

    <div class="flex flex-row justify-center items-center gap-[4px]">
      <p class="font-body">
        Didn't receive code?
      </p>
      <button 
        class="text-primary-300 font-body" 
        z-button 
        zSize="sm" 
        zType="link"
        (click)="resendConfirmation()"
      >
        Resend
      </button>
    </div>
  `,
  exportAs: 'verifyEmailChangeDialog',
})
export class VerifyEmailChangeDialog {
  private zData: IVerifyEmailChangeData = inject(Z_MODAL_DATA);
  codeVerificationLoading = signal<boolean>(false)

  constructor(
    private authService: AuthService,
  ) {}
 
  verifyEmailChangeForm = new FormGroup({
    code: new FormControl<string>('', [Validators.required, Validators.minLength(6)])
  })
 
  get codeControl() {
    return this.verifyEmailChangeForm.get('password')!;
  }

  handleVerificationSubmit() {
      this.codeVerificationLoading.set(true);
  
      const verificationData: IEmailVerificationData = {
        email: this.zData.email,
        code: this.verifyEmailChangeForm.value.code!,
      };
  
      this.authService.confirmEmail(verificationData).subscribe({
        next: (response: any) => {
          this.codeVerificationLoading.set(false);
          toast.success('Email changed successfully', {
            position: 'bottom-center',
            duration: 2000,
          });
        },
        error: (err: any) => {
          this.codeVerificationLoading.set(false);
          toast.success('Code does not match', {
            position: 'bottom-center',
            duration: 2000,
          });
          console.log('verification failed', err);
        }
      });
    }
  
    resendConfirmation() {
  
      const email = this.zData.email!;
  
      this.authService.resendConfirmation(email).subscribe({
        next: (response: any) => {
          toast.success('Code resent successfully', {
            position: 'bottom-center',
            duration: 2000,
          });
        },
        error: (err: any) => {
          toast.success('Resending confirmation code failed', {
            position: 'bottom-center',
            duration: 2000,
          });
          console.log('Resending Confirmation failed', err);
        }
      });
    }

}

@Component({
  selector: 'woodia-account',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ZardDividerComponent,
    ZardInputDirective,
    ZardFormModule,
    ZardButtonComponent,
    ZardAvatarComponent,
    // ZardDialogComponent,
    // ZardInputGroupComponent,
    // ZardIconComponent,
],
  templateUrl: './account.html',
  styleUrl: './account.scss',
})
export class Account implements OnInit {
  userDataHolder: IUserData = { firstName: '', lastName: '', email: '' };

  constructor(
    private settingsService: CustomerSettingsService,
    private authService: AuthService,
    private dialogService: ZardDialogService
  ) {}

  infoForm = new FormGroup({
    firstName: new FormControl<string>('', [Validators.required]),
    lastName: new FormControl<string>('', [Validators.required]),
  });

  emailForm = new FormGroup({
    email: new FormControl<string>('', [Validators.required, Validators.email]),
  });

  get emailControl() {
    return this.emailForm.get('email')!;
  }


  ngOnInit(): void {
    this.settingsService.getMe().subscribe({
      next: (userData) => {
        this.userDataHolder = {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email
        }

        this.infoForm.patchValue({
          firstName: userData.firstName,
          lastName: userData.lastName,
        });
        this.emailForm.patchValue({
          email: userData.email
        })
      },
      error: (err) => {
        toast.error('Error fetching user data', {
          position: 'bottom-center',
        });
        console.error('Error fetching user data', err)
      },
    });
  }


  // ===========================================================
  // INFO
  // ===========================================================
  infoFormLoading = signal<boolean>(false)

  handleInfoSubmit() {
    if (this.infoForm.invalid) {
      this.infoForm.markAllAsTouched();
      return;
    }

    this.infoFormLoading.set(true)

    const body = {
      firstName: this.infoForm.value.firstName,
      lastName: this.infoForm.value.lastName,
    };

    this.settingsService.updateInfo(body).subscribe({
      next: (res) => {
        this.infoFormLoading.set(false)

        toast.success('Name updated successful', {
          position: 'bottom-center',
        });

        this.infoForm.markAsPristine()
      },
      error: (err) => {
        this.infoFormLoading.set(false)

        toast.error('Name update was not successful', {
          position: 'bottom-center',
        });
      },
    });
  }

  cancelInfoUpdate() {
    console.log('firstName', this.userDataHolder.firstName)

    this.infoForm.patchValue(
      {
        firstName: this.userDataHolder.firstName,
        lastName: this.userDataHolder.lastName,
      },
    )
  }

  // ===========================================================
  // CHANGE EMAIL
  // ===========================================================
  emailFormLoading = signal<boolean>(false)

  verifyEmailChange() {
    this.dialogService.create({
      zTitle: 'Enter Code',
      zDescription: `Make changes to your profile here. Click save when you're done.`,
      zContent: VerifyEmailChangeDialog,
      zData: {
        email: this.emailForm.value.email
      } as IVerifyEmailChangeData,
      zOkText: 'Verify Email',
      // zOkDisabled: (instance) => instance.authenticateForm.invalid,
      zOnOk: (instance: any) => {
        console.log('Form submitted:', instance.authenticateForm.value);
      },
      zWidth: '425px',
    })
  }

  handleEmailUpdate() {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      console.log('did not reach')
      return;
    }

    const body = {
      newEmail: this.emailForm.value.email!,
    };

    this.emailFormLoading.set(true);

    this.settingsService.changeEmail(body).subscribe({
      next: (res) => {
        this.verifyEmailChange()
        this.emailFormLoading.set(false)
      },
      error: (err) => {
        this.emailFormLoading.set(false)
        const errors = err.error?.errors || [];
        
        if (errors.includes('User.InvalidCredentials') || errors.includes('Invalid email/password')) {
          this.emailControl.setErrors({ backend: 'Invalid email or password' });
          return;
        }

        toast.error('Email update was not successful', {
          position: 'bottom-center',
        })
        console.error('Email change error:', err)
      },
    });
  }

  cancelEmailUpdate() {
    this.emailForm.reset()
  }

  // ===========================================================
  // CHANGE PASSWORD (if your API has it)
  // ===========================================================
  // handlePasswordChange() {
  //   if (this.passwordForm.invalid) {
  //     this.passwordForm.markAllAsTouched();
  //     return;
  //   }

  //   const body = {
  //     password: this.passwordForm.value.password,
  //   };

  //   // If your API endpoint for password is /me/change-password
  //   // add it in your service then call it here
  //   console.log('Password change body:', body);
  // }

}
