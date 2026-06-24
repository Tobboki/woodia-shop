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
    ZardInputGroupComponent,
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

  previewUrl = signal<string | undefined>(undefined);
  selectedFile = signal<File | null>(null);


  // Server-side field errors (set after API call fails with 409 etc.)
  serverErrors = signal<Record<string, string>>({});

  profForm: FormGroup = this.fb.group({
    hourlyRate: [null, [Validators.required, Validators.min(20), Validators.max(1000)]],
    profileOverview: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(1000)]],
    profileImageUrl: [''],
  });

  contactForm: FormGroup = this.fb.group({
    phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9+]{10,15}$/)]],
    addressLine: ['', [Validators.required]],
    governateId: [null, [Validators.required]],
    additionalInfo: [''],
  });

  // ── Form control helpers for template ──
  // Using getter methods instead of computed() because FormControl.touched
  // is a plain boolean property, not a signal — computed() cannot track it.

  get hourlyRateControl() { return this.profForm.get('hourlyRate')!; }
  get profileOverviewControl() { return this.profForm.get('profileOverview')!; }
  get phoneControl() { return this.contactForm.get('phoneNumber')!; }
  get addressControl() { return this.contactForm.get('addressLine')!; }
  get governorateControl() { return this.contactForm.get('governateId')!; }

  // ── Lifecycle ──

  ngOnInit(): void {
    this.loadData();

    this.contactForm.get('phoneNumber')?.valueChanges.subscribe(() => {
      this.serverErrors.update(errors => {
        const { phoneNumber, ...rest } = errors;
        return rest;
      });

      const control = this.contactForm.get('phoneNumber');

      if (control?.hasError('serverError')) {
        const currentErrors = { ...(control.errors ?? {}) };
        delete currentErrors['serverError'];

        control.setErrors(
          Object.keys(currentErrors).length ? currentErrors : null
        );
      }
    });
  }

  loadData(): void {
    this.loading.set(true);

    this.constantsService.getGovernorates().subscribe({
      next: (govs: IGovernorate[]) => this.governorates.set(govs),
    });

    this.makerService.getProfessionalProfile().subscribe({
      next: (prof: IProfessionalProfile | null) => {
        if (prof) {
          this.profForm.patchValue(prof);
          if (prof.profileImageUrl) this.previewUrl.set(prof.profileImageUrl ?? undefined);
        }
      },
      // 404 = no profile yet — this is expected for new users, not an error
      error: () => { },
    });

    this.makerService.getContactInfo().subscribe({
      next: (contact: IContactInfo | null) => {
        if (contact) this.contactForm.patchValue(contact);
        this.loading.set(false);
      },
      // 404 = no contact info yet — expected for new users
      error: () => this.loading.set(false),
    });
  }

  // ── Photo selection ──
  // FileReader.onload fires outside Angular's scheduler in a zoneless app,
  // so assigning the result to a signal there won't trigger CD. Instead,
  // use URL.createObjectURL which is synchronous and returns immediately
  // inside the event handler — no async callback needed.

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    this.selectedFile.set(file);

    // Revoke the previous object URL to avoid memory leaks
    const prev = this.previewUrl();
    if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);

    // createObjectURL is synchronous — runs inside the (change) handler
    // which Angular's event binding schedules inside its own tick, so
    // the signal write immediately triggers re-render.
    this.previewUrl.set(URL.createObjectURL(file));
  }

  // ── Navigation ──

  nextStep(): void {
    if (this.currentStep() === 2 && this.profForm.invalid) {
      this.profForm.markAllAsTouched();
      return;
    }
    this.currentStep.update(s => s + 1);
  }

  prevStep(): void {
    this.currentStep.update(s => s - 1);
  }

  // ── Submit ──

  async completeOnboarding(): Promise<void> {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    try {
      // Upload photo if a new file was selected
      if (this.selectedFile()) {
        const urls = await this.uploadService.uploadFile(this.selectedFile()!).toPromise();
        if (urls?.length) this.profForm.patchValue({ profileImageUrl: urls[0] });
      }

      // Create professional profile — skip silently if one already exists
      // (happens when user fixes phone after a 409 and resubmits)
      try {
        await this.makerService.createProfessionalProfile(this.profForm.value as IProfessionalProfile).toPromise();
      } catch (err: any) {
        const errors: string[] = err?.error?.errors ?? [];
        const isAlreadyExists =
          errors.includes('Profile.Conflict') ||
          errors.some((e: string) => e.includes('User Already Has A Professional Profile'));

        // Only swallow the "already exists" conflict — rethrow anything else
        if (!isAlreadyExists) throw err;
      }

      // Create contact info — skip silently if one already exists
      try {
        await this.makerService.createContactInfo(this.contactForm.value as IContactInfo).toPromise();
      } catch (err: any) {
        const errors: string[] = err?.error?.errors ?? [];
        const isAlreadyExists = errors.some((e: string) => e.includes('User Already Has A'));

        if (!isAlreadyExists) throw err;
      }

      this.serverErrors.set({});
      toast.success(this.transloco.translate('features.makers.onboarding.messages.onboardingSuccess'));
      this.authService.setIsProfileComplete(true);
      this.router.navigate(['/makers/jobs']);

    } catch (error: any) {
      console.error('Onboarding failed', error);

      const status = error?.status;
      const errors: string[] = error?.error?.errors ?? [];

      if (status === 409 && errors.includes('User.DuplicatedPhone')) {
        this.currentStep.set(3);
        this.serverErrors.set({
          phoneNumber: this.transloco.translate(
            'features.makers.onboarding.steps.3.errors.duplicatedPhone'
          ),
        });
        this.contactForm.get('phoneNumber')?.setErrors({ serverError: true });
        this.contactForm.get('phoneNumber')?.markAsTouched();
      } else {
        toast.error(
          this.transloco.translate('features.makers.onboarding.errors.onboardingError')
        );
      }
    } finally {
      this.submitting.set(false);
    }
  }

  get isDark(): boolean {
    return this.themeService.mode() === 'dark';
  }
}