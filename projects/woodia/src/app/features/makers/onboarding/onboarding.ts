import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { toast } from 'ngx-sonner';

import { MakerService, IProfessionalProfile, IContactInfo } from '@woodia-core/services/maker.service';
import { ConstantsService, IGovernorate } from '@woodia-core/services/constants.service';
import { ZardButtonComponent } from '@shared-components/button/button.component';
import { ZardFormModule } from '@shared-components/form/form.module';
import { ZardInputDirective } from '@shared-components/input/input.directive';
import { ZardAvatarComponent } from '@shared-components/avatar/avatar.component';
import { UploadService } from '@woodia-core/services/upload.service';
import { ThemeService } from '@woodia-core/services/theme.service';
import { ZardSelectImports } from 'shared-lib/components/select';
import { ZardInputGroupComponent } from 'shared-lib/components/input-group/input-group.component';
import { AuthService } from '@woodia-core/services/auth.service';

@Component({
  selector: 'woodia-maker-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgIcon,
    TranslocoDirective,
    ZardButtonComponent,
    ZardFormModule,
    ZardInputDirective,
    ZardAvatarComponent,
    ZardSelectImports,
    ZardInputGroupComponent
  ],
  templateUrl: './onboarding.html',
})
export class Onboarding implements OnInit {
  private fb = inject(FormBuilder);
  private makerService = inject(MakerService);
  private constantsService = inject(ConstantsService);
  private uploadService = inject(UploadService);
  private themeService = inject(ThemeService);
  private transloco = inject(TranslocoService);
  private router = inject(Router);
  private authService = inject(AuthService);

  currentStep = signal<number>(1);
  loading = signal<boolean>(false);
  submitting = signal<boolean>(false);

  governorates = signal<IGovernorate[]>([]);

  // Forms
  profForm: FormGroup;
  contactForm: FormGroup;

  // Image handling
  previewUrl = signal<string | null>(null);
  selectedFile = signal<File | null>(null);

  constructor() {
    this.profForm = this.fb.group({
      hourlyRate: [null, [Validators.required, Validators.min(1)]],
      profileOverview: ['', [Validators.required, Validators.minLength(20)]],
      profileImageUrl: [''],
    });

    this.contactForm = this.fb.group({
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9+]{10,15}$/)]],
      addressLine: ['', [Validators.required]],
      governateId: [null, [Validators.required]],
      additionalInfo: [''],
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      this.constantsService.getGovernorates().subscribe({
        next: (govs: IGovernorate[]) => this.governorates.set(govs),
      });

      // Check if they already have some info
      this.makerService.getProfessionalProfile().subscribe({
        next: (prof: IProfessionalProfile | null) => {
          if (prof) {
            this.profForm.patchValue(prof);
            this.previewUrl.set(prof.profileImageUrl);
          }
        },
      });

      this.makerService.getContactInfo().subscribe({
        next: (contact: IContactInfo | null) => {
          if (contact) {
            this.contactForm.patchValue(contact);
          }
        },
      });
    } catch (error) {
      console.error('Error loading onboarding data', error);
    } finally {
      this.loading.set(false);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    this.selectedFile.set(file);

    const reader = new FileReader();
    reader.onload = () => this.previewUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  nextStep() {
    if (this.currentStep() === 2 && this.profForm.invalid) {
      this.profForm.markAllAsTouched();
      return;
    }
    this.currentStep.update(s => s + 1);
  }

  prevStep() {
    this.currentStep.update(s => s - 1);
  }

  async completeOnboarding() {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    try {
      // 1. Upload image if selected
      if (this.selectedFile()) {
        const urls = await this.uploadService.uploadFile(this.selectedFile()!).toPromise();
        if (urls && urls.length > 0) {
          this.profForm.patchValue({ profileImageUrl: urls[0] });
        }
      }

      // 2. Save Professional Profile (skip if already exists)
      try {
        await this.makerService.createProfessionalProfile(this.profForm.value as IProfessionalProfile).toPromise();
      } catch (profError: any) {
        const message = profError?.error?.message ?? profError?.message ?? '';
        if (!message.includes('User Already Has A Professional Profile')) {
          throw profError; // re-throw unexpected errors
        }
      }

      // 3. Save Contact Info (skip if already exists)
      try {
        await this.makerService.createContactInfo(this.contactForm.value as IContactInfo).toPromise();
      } catch (contactError: any) {
        const message = contactError?.error?.message ?? contactError?.message ?? '';
        if (!message.includes('User Already Has A')) {
          throw contactError; // re-throw unexpected errors
        }
      }

      toast.success(this.transloco.translate('features.makers.onboarding.messages.onboardingSuccess'));
      this.authService.setIsProfileComplete(true);
      this.router.navigate(['/makers/jobs']);
    } catch (error) {
      console.error('Onboarding failed', error);
      toast.error(this.transloco.translate('features.makers.onboarding.errors.onboardingError'));
    } finally {
      this.submitting.set(false);
    }
  }

  get isDark() {
    return this.themeService.mode() === 'dark';
  }
}
