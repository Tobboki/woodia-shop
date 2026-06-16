import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ZardAvatarComponent } from '@shared-components/avatar/avatar.component';
import { ZardButtonComponent } from '@shared-components/button/button.component';
import { ZardDialogService } from '@shared-components/dialog/dialog.service';
import { ZardDividerComponent } from '@shared-components/divider/divider.component';
import { ZardFormModule } from '@shared-components/form/form.module';
import { ZardSkeletonComponent } from '@shared-components/skeleton/skeleton.component';
import { ZardBadgeComponent } from '@shared-components/badge/badge.component';
import { MakerService, IMakerProfile } from '@woodia-core/services/maker.service';
import { CustomerSettingsService } from '@woodia-core/services/customer-settings-service';
import { AuthService } from '@woodia-core/services/auth.service';
import { toast } from 'ngx-sonner';
import { ZardInputDirective } from '@shared-components/input/input.directive';
import { NgIcon } from '@ng-icons/core';
import { ThemeService } from '@woodia-core/services/theme.service';
import { UploadService } from '@woodia-core/services/upload.service';
import { isImage } from '@woodia-shared/utils/helpers';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { VerifyEmailChangeDialog } from '@woodia-features/customers/settings/account/account';

interface IUserData {
  firstName: string;
  lastName: string;
  email: string;
  photoUrl: string | null;
}

@Component({
  selector: 'woodia-maker-account',
  imports: [
    ReactiveFormsModule,
    ZardDividerComponent,
    ZardInputDirective,
    ZardFormModule,
    ZardButtonComponent,
    ZardAvatarComponent,
    ZardSkeletonComponent,
    ZardBadgeComponent,
    NgIcon,
    TranslocoDirective
  ],
  templateUrl: './account.html',
  styleUrl: './account.scss',
})
export class Account implements OnInit {
  isImage = isImage;

  constructor(
    private makerService: MakerService,
    private settingsService: CustomerSettingsService,
    private authService: AuthService,
    private dialogService: ZardDialogService,
    private uploadService: UploadService,
    private themeService: ThemeService,
    private transloco: TranslocoService,
  ) { }

  userDataHolder: IUserData = { firstName: '', lastName: '', email: '', photoUrl: '' };

  infoForm = new FormGroup({
    firstName: new FormControl<string>('', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]),
    lastName: new FormControl<string>('', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]),
  });

  get firstNameControl() {
    return this.infoForm.get('firstName')!;
  }

  get lastNameControl() {
    return this.infoForm.get('lastName')!;
  }

  emailForm = new FormGroup({
    email: new FormControl<string>('', [Validators.required, Validators.email]),
  });

  get emailControl() {
    return this.emailForm.get('email')!;
  }

  userType = computed(() => {
    const type = this.authService.getCurrentUser()?.userType;
    if (type === 'CLIENT') return 'Client';
    if (type === 'MAKER') return 'Maker';
    return type;
  });

  ngOnInit(): void {
    this.makerService.getMe().subscribe({
      next: (userData: IMakerProfile) => {
        this.userDataHolder = {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          photoUrl: userData.photoUrl,
        };

        this.hasPersistedPhoto.set(!!userData.photoUrl);

        this.infoForm.patchValue({
          firstName: userData.firstName,
          lastName: userData.lastName,
        });

        this.emailForm.patchValue({
          email: userData.email
        });

        this.infoLoading.set(false);
      },
      error: (err) => {
        toast.error(this.transloco.translate('features.makers.settings.errors.fetchUserDataFailed'), {
          position: 'bottom-center',
        });

        console.error('Error fetching user data', err);

        this.infoLoading.set(false);
      },
    });
  }

  // Profile Picture
  profilePicturePlaceholder = '/images/customer/settings/account/profile-picture-placeholder.png';
  profilePicturePlaceholderDark = '/images/customer/settings/account/profile-picture-placeholder-dark.png';

  profilePictureLoading = signal<boolean>(false);

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

    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      toast.error(this.transloco.translate('features.makers.settings.errors.invalidFileType'), {
        position: 'bottom-center',
      });
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(this.transloco.translate('features.makers.settings.errors.fileTooLarge'), {
        position: 'bottom-center',
      });
      return;
    }

    this.selectedFile.set(file);

    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  onSavePicture() {
    if (!this.selectedFile()) return;

    this.profilePictureLoading.set(true);

    this.uploadService.uploadFile(this.selectedFile()!).subscribe({
      next: (urls: string[]) => {
        const uploadedUrl = urls[0];

        const request$ = this.hasPersistedPhoto()
          ? this.makerService.updateProfileImage(uploadedUrl)
          : this.makerService.addProfileImage(uploadedUrl);

        request$.subscribe({
          next: () => {
            this.profilePictureLoading.set(false);

            this.userDataHolder.photoUrl = uploadedUrl;

            this.previewUrl.set(null);
            this.selectedFile.set(null);
            this.hasPersistedPhoto.set(true);

            toast.success(this.transloco.translate('features.makers.settings.messages.profilePictureSaved'), {
              position: 'bottom-center',
            });
          },
          error: () => {
            this.profilePictureLoading.set(false);

            toast.error(this.transloco.translate('features.makers.settings.errors.savePictureFailed'), {
              position: 'bottom-center',
            });
          }
        });
      },
      error: () => {
        this.profilePictureLoading.set(false);

        toast.error(this.transloco.translate('features.makers.settings.errors.uploadFailed'), {
          position: 'bottom-center',
        });
      }
    });
  }

  // Info
  infoLoading = signal<boolean>(true);
  infoFormLoading = signal<boolean>(false);

  handleInfoSubmit() {
    if (this.infoForm.invalid) {
      this.infoForm.markAllAsTouched();
      return;
    }

    this.infoFormLoading.set(true);

    const body = {
      firstName: this.infoForm.value.firstName!,
      lastName: this.infoForm.value.lastName!,
    };

    this.makerService.updateBasicInfo(body).subscribe({
      next: () => {
        this.infoFormLoading.set(false);

        toast.success(this.transloco.translate('features.makers.settings.messages.nameUpdateSuccess'), {
          position: 'bottom-center',
        });

        this.userDataHolder.firstName = this.infoForm.value.firstName!;
        this.userDataHolder.lastName = this.infoForm.value.lastName!;

        this.infoForm.markAsPristine();
      },
      error: () => {
        this.infoFormLoading.set(false);

        toast.error(this.transloco.translate('features.makers.settings.errors.nameUpdateFailed'), {
          position: 'bottom-center',
        });
      },
    });
  }

  cancelInfoUpdate() {
    this.infoForm.patchValue({
      firstName: this.userDataHolder.firstName,
      lastName: this.userDataHolder.lastName,
    });
  }

  // Email Change
  emailFormLoading = signal<boolean>(false);

  verifyEmailChange() {
    interface IVerifyEmailChangeData {
      email: string;
    }

    const dialogRef = this.dialogService.create({
      zTitle: this.transloco.translate('features.makers.settings.emailVerificationTitle'),
      zDescription: this.transloco.translate('features.makers.settings.emailVerificationDesc', { email: this.emailForm.value.email }),
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
      return;
    }

    const body = {
      email: this.emailForm.value.email!,
    };

    this.emailFormLoading.set(true);

    this.settingsService.changeEmail(body).subscribe({
      next: () => {
        this.verifyEmailChange();
        this.emailFormLoading.set(false);
      },
      error: (err) => {
        this.emailFormLoading.set(false);
        const errors = err.error?.errors || [];

        if (errors.includes('User.DuplicatedEmail')) {
          this.emailControl.setErrors({ duplicated: true });
          return;
        }

        if (errors.includes('User.InvalidCredentials') || errors.includes('Invalid email/password')) {
          return;
        }

        toast.error(this.transloco.translate('features.makers.settings.errors.emailUpdateFailed'), {
          position: 'bottom-center',
        });
        console.error('Email change error:', err);
      },
    });
  }

  cancelEmailUpdate() {
    this.emailForm.reset({
      email: this.userDataHolder.email
    });
  }
}
