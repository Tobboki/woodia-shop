import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ZardAvatarComponent } from '@shared-components/avatar/avatar.component';
import { ZardButtonComponent } from '@shared-components/button/button.component';
import { Z_MODAL_DATA, ZardDialogRef, ZardDialogService } from '@shared-components/dialog/dialog.service';
import { ZardDividerComponent } from '@shared-components/divider/divider.component';
import { ZardFormModule } from '@shared-components/form/form.module'
import { ZardSkeletonComponent } from '@shared-components/skeleton/skeleton.component';
import { CustomerSettingsService } from '@woodia-core/services/customer-settings-service';
import { toast } from 'ngx-sonner';
import { ZardInputDirective } from '@shared-components/input/input.directive';
import { NgIcon } from '@ng-icons/core';
import { ThemeService } from '@woodia-core/services/theme.service';
import { UploadService } from '@woodia-core/services/upload.service';
import { isImage } from '@woodia-shared/utils/helpers';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

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
  photoUrl: string | null
}
@Component({
  selector: 'verify-email-change-dialog',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ZardInputDirective,
    ZardFormModule,
    ZardButtonComponent,
    TranslocoDirective
  ],
  standalone: true,
  template: `
    <form [formGroup]="verifyEmailChangeForm" (ngSubmit)="handleVerificationSubmit()" class="space-y-6 my-[40px]" *transloco="let t">
      <z-form-field>
        <label class="font-label" z-form-label zRequired>
          {{ t('features.customers.settings.emailVerificationCode') }}
        </label>
        <z-form-control>
          <input
            z-input
            type="text"
            [placeholder]="t('features.customers.settings.emailVerificationCodePlaceholder')"
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
        {{ t('features.customers.settings.verifyEmail') }}
      </button>
    </form>

    <div class="flex flex-row justify-center items-center gap-[4px]" *transloco="let t">
      <p class="font-body">
        {{ t('features.customers.settings.didntReceiveCode') }}
      </p>
      <button
        class="text-primary font-body"
        z-button
        zSize="sm"
        zType="link"
        (click)="resendConfirmation()"
      >
        {{ t('features.customers.settings.resend') }}
      </button>
    </div>
  `,
  exportAs: 'verifyEmailChangeDialog',
})
export class VerifyEmailChangeDialog {
  private zData: IVerifyEmailChangeData = inject(Z_MODAL_DATA);
  private dialogRef = inject(ZardDialogRef<VerifyEmailChangeDialog>);
  codeVerificationLoading = signal<boolean>(false)

  constructor(
    private settingsService: CustomerSettingsService,
    private transloco: TranslocoService
  ) { }

  verifyEmailChangeForm = new FormGroup({
    code: new FormControl<string>('', [Validators.required, Validators.minLength(6)])
  })

  get codeControl() {
    return this.verifyEmailChangeForm.get('code')!;
  }

  handleVerificationSubmit() {
    this.codeVerificationLoading.set(true);

    const verificationData: IEmailVerificationData = {
      email: this.zData.email,
      code: this.verifyEmailChangeForm.value.code!,
    };

    this.settingsService.verifyEmail(verificationData).subscribe({
      next: () => {
        this.codeVerificationLoading.set(false);

        toast.success(this.transloco.translate('features.customers.settings.emailChangedSuccess'), {
          position: 'bottom-center',
          duration: 2000,
        });

        this.dialogRef.close(true);
      },
      error: (err: any) => {
        this.codeVerificationLoading.set(false);

        toast.error(this.transloco.translate('features.customers.settings.codeMismatch'), {
          position: 'bottom-center',
          duration: 2000,
        });

        console.log('verification failed', err);
      }
    });
  }

  resendConfirmation() {

    const email = this.zData.email!;

    this.settingsService.resendEmailVerificationCode(email).subscribe({
      next: () => {
        toast.success(this.transloco.translate('features.customers.settings.resendSuccess'), {
          position: 'bottom-center',
          duration: 2000,
        });
      },
      error: (err: any) => {
        toast.error(this.transloco.translate('features.customers.settings.resendFailed'), {
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
    ReactiveFormsModule,
    ZardDividerComponent,
    ZardInputDirective,
    ZardFormModule,
    ZardButtonComponent,
    ZardAvatarComponent,
    ZardSkeletonComponent,
    NgIcon,
    TranslocoDirective
  ],
  templateUrl: './account.html',
  styleUrl: './account.scss',
})
export class Account implements OnInit {
  // helpers
  isImage = isImage;

  constructor(
    private settingsService: CustomerSettingsService,
    private dialogService: ZardDialogService,
    private uploadService: UploadService,
    private themeService: ThemeService,
    private transloco: TranslocoService,
  ) { }

  userDataHolder: IUserData = { firstName: '', lastName: '', email: '', photoUrl: '' };

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
      next: (userData: IUserData) => {
        this.userDataHolder = {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          photoUrl: userData.photoUrl,
        }

        this.hasPersistedPhoto.set(!!userData.photoUrl);

        this.infoForm.patchValue({
          firstName: userData.firstName,
          lastName: userData.lastName,
        });

        this.emailForm.patchValue({
          email: userData.email
        })

        this.infoLoading.set(false)
      },
      error: (err) => {
        toast.error(this.transloco.translate('features.customers.settings.errors.fetchUserDataFailed'), {
          position: 'bottom-center',
        });

        console.error('Error fetching user data', err)

        this.infoLoading.set(false)
      },
    });
  }


  // ===========================================================
  // Profile Picture
  // ===========================================================
  profilePicturePlaceholder = '/images/customer/settings/account/profile-picture-placeholder.png'
  profilePicturePlaceholderDark = '/images/customer/settings/account/profile-picture-placeholder-dark.png'

  profilePictureLoading = signal<boolean>(false)

  previewUrl = signal<string | null>(null);
  selectedFile = signal<File | null>(null);
  hasPersistedPhoto = signal<boolean>(false);

  get avatarSrc(): string {
    if (this.previewUrl()) return this.previewUrl() ?? "";

    if (this.isImage(this.userDataHolder.photoUrl)) {
      return this.userDataHolder.photoUrl!;
    }

    return this.themeService.mode() === 'dark'
      ? this.profilePicturePlaceholderDark
      : this.profilePicturePlaceholder;
  }

  get hasPreview(): boolean {
    return !!this.previewUrl();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Validate Type
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      toast.error(this.transloco.translate('features.customers.settings.errors.invalidFileType'), {
        position: 'bottom-center',
      });
      return;
    }

    // Validate size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(this.transloco.translate('features.customers.settings.errors.fileTooLarge'), {
        position: 'bottom-center',
      });
      return;
    }

    this.selectedFile.set(file);

    // Preview
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  onSavePicture() {
    if (!this.selectedFile) return;

    this.profilePictureLoading.set(true);

    this.uploadService.uploadFile(this.selectedFile()!).subscribe({
      next: (urls: string[]) => {
        const uploadedUrl = urls[0];

        const request$ = this.hasPersistedPhoto()
          ? this.settingsService.updateProfileImage(uploadedUrl)
          : this.settingsService.addProfileImage(uploadedUrl);

        request$.subscribe({
          next: () => {
            this.profilePictureLoading.set(false);

            this.userDataHolder.photoUrl = uploadedUrl;

            this.previewUrl.set(null);
            this.selectedFile.set(null);
            this.hasPersistedPhoto.set(true);

            toast.success(this.transloco.translate('features.customers.settings.messages.profilePictureSaved'), {
              position: 'bottom-center',
            });
          },
          error: () => {
            this.profilePictureLoading.set(false);

            toast.error(this.transloco.translate('features.customers.settings.errors.savePictureFailed'), {
              position: 'bottom-center',
            });
          }
        });
      },
      error: () => {
        this.profilePictureLoading.set(false);

        toast.error(this.transloco.translate('features.customers.settings.errors.uploadFailed'), {
          position: 'bottom-center',
        });
      }
    });
  }


  // ===========================================================
  // INFO
  // ===========================================================

  infoLoading = signal<boolean>(true)
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
      next: () => {
        this.infoFormLoading.set(false)

        toast.success(this.transloco.translate('features.customers.settings.messages.nameUpdateSuccess'), {
          position: 'bottom-center',
        });

        this.userDataHolder.firstName = this.infoForm.value.firstName!
        this.userDataHolder.lastName = this.infoForm.value.lastName!

        this.infoForm.markAsPristine()
      },
      error: () => {
        this.infoFormLoading.set(false)

        toast.error(this.transloco.translate('features.customers.settings.errors.nameUpdateFailed'), {
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
    const dialogRef = this.dialogService.create({
      zTitle: this.transloco.translate('features.customers.settings.emailVerificationTitle'),
      zDescription: this.transloco.translate('features.customers.settings.emailVerificationDesc', { email: this.emailForm.value.email }),
      zContent: VerifyEmailChangeDialog,
      zData: {
        email: this.emailForm.value.email
      } as IVerifyEmailChangeData,
      zHideFooter: true,
      zWidth: '425px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.userDataHolder.email = this.emailForm.value.email!;
        this.emailForm.markAsPristine();
      }
    });
  }

  handleEmailUpdate() {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      console.log('did not reach')
      return;
    }

    const body = {
      email: this.emailForm.value.email!,
    };

    this.emailFormLoading.set(true);

    this.settingsService.changeEmail(body).subscribe({
      next: () => {
        this.verifyEmailChange()
        this.emailFormLoading.set(false)
      },
      error: (err) => {
        this.emailFormLoading.set(false)
        const errors = err.error?.errors || [];

        if (errors.includes('User.DuplicatedEmail')) {
          this.emailControl.setErrors({ duplicated: true });
          return;
        }

        if (errors.includes('User.InvalidCredentials') || errors.includes('Invalid email/password')) {
          return;
        }

        toast.error(this.transloco.translate('features.customers.settings.errors.emailUpdateFailed'), {
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
