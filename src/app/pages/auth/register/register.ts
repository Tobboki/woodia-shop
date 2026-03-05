import { AfterViewChecked, AfterViewInit, Component, ElementRef, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, IEmailVerificationData } from '@shared/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { ZardFormModule } from '@shared/components/form/form.module';
import { ZardCheckboxComponent } from '@shared/components/checkbox/checkbox.component';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import { ZardDividerComponent } from '@shared/components/divider/divider.component';
import { LogoComponent } from '@shared/components/logo/logo.component';
import { matchPasswordsValidator } from '@shared/validators/match-password-validator';
import { passwordStrengthValidator } from '@shared/validators/password-strength-validator';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ZardButtonComponent,
    ZardCheckboxComponent,
    ZardIconComponent,
    ZardInputDirective,
    ZardDividerComponent,
    ZardFormModule,
    LogoComponent
  ],
  templateUrl: './register.html',
  styleUrls: ['./register.scss'],
})
export class Register implements OnInit, AfterViewInit {

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  @ViewChild('videoPlayer') videoRef!: ElementRef<HTMLVideoElement>;
  
  // panels
  customerPanels: string[] = [
    '/videos/auth/customer-panel-1.mp4',
    '/videos/auth/customer-panel-2.mp4',
    '/videos/auth/customer-panel-3.mp4',
    '/videos/auth/customer-panel-4.mp4',
  ];

  makerPanels: string[] = [
    '/videos/auth/maker-panel-1.mp4',
    '/videos/auth/maker-panel-2.mp4',
    '/videos/auth/maker-panel-3.mp4',
    '/videos/auth/maker-panel-4.mp4',
  ];

  panels: string[] = [];

  currentIndex = 0;
  currentVideo = this.panels[this.currentIndex];

  ngAfterViewInit() {
    const video = this.videoRef.nativeElement;
    video.muted = true;
    video.play().catch(() => {});
  }

  playNext() {
    this.currentIndex = (this.currentIndex + 1) % this.panels.length;
    this.currentVideo = this.panels[this.currentIndex];

    // small timeout ensures src updates before playing
    setTimeout(() => {
      this.videoRef.nativeElement.play();
    });
  }

  resetVideoLoop() {
    this.currentIndex = 0;
    this.currentVideo = this.panels[0];

    if (this.videoRef) {
      const video = this.videoRef.nativeElement;
      video.pause();
      video.muted = true;
      video.load();

      setTimeout(() => {
        video.play().catch(() => {});
      });
    }
  }

  // Strongly typed registration form
  registerForm = new FormGroup({
    firstName: new FormControl<string>('', [Validators.required]),
    lastName: new FormControl<string>('', [Validators.required]),
    email: new FormControl<string>('', [Validators.required, Validators.email]),
    password: new FormControl<string>('', [Validators.required, Validators.minLength(8), passwordStrengthValidator()]),
    confirmPassword: new FormControl<string>('', [Validators.required]),
    agreeToTerms: new FormControl<boolean>(false),
  }, {
    validators: [
      matchPasswordsValidator,
    ]
  });

  get firstNameControl() {
    return this.registerForm.get('firstName')!;
  }
  get lastNameControl() {
    return this.registerForm.get('lastName')!;
  }
  get emailControl() {
    return this.registerForm.get('email')!;
  }

  get passwordControl() {
    return this.registerForm.get('password')!;
  }

  get confirmPasswordControl() {
    return this.registerForm.get('confirmPassword')!;
  }

  emailVerificationForm = new FormGroup({
    code: new FormControl<string>('', [Validators.required, Validators.minLength(6)])
  })

  // Signals
  registerStep = signal<'userType' | 'credentials' | 'verification'>('userType');
  userType = signal<'customer' | 'maker'>('customer');
  showPassword = signal<boolean>(false);
  showConfirmPassword = signal<boolean>(false);
  registerFormLoading = signal<boolean>(false)
  codeVerificationLoading = signal<boolean>(false)

  ngOnInit(): void {
  this.route.queryParamMap.subscribe(params => {
      const type = params.get('type');

      if (type === 'maker') {
        this.userType.set('maker');
        this.panels = this.makerPanels;
      } else {
        this.userType.set('customer');
        this.panels = this.customerPanels;
      }

      this.resetVideoLoop();
    });
  }

  handleCredentialsSubmit() {
    if (this.registerForm.invalid) return;

    this.registerFormLoading.set(true)

    const userData = {
      firstName: this.registerForm.value.firstName!,
      lastName: this.registerForm.value.lastName!,
      email: this.registerForm.value.email!,
      password: this.registerForm.value.password!,
      type: this.userType() === 'customer' ? 'client' : 'carpenter',
    };

    // Call the register method
    this.authService.register(userData).subscribe({
      next: (response) => {
        toast.success('Registration Successful', {
          position: 'bottom-center',
          duration: 2000,
        });
        this.registerFormLoading.set(false);
        this.registerStep.set('verification')
      },
      error: (err) => {
        this.registerFormLoading.set(false);
        console.log('register failed', err);
      }
    });
  }

  handleVerificationSubmit() {
    if (this.registerForm.invalid) return;

    this.codeVerificationLoading.set(true);

    const verificationData: IEmailVerificationData = {
      email: this.registerForm.value.email!,
      code: this.emailVerificationForm.value.code!,
    };

    this.authService.confirmEmail(verificationData).subscribe({
      next: (response: any) => {
        this.codeVerificationLoading.set(false);
        toast.success('Verification Successful', {
          position: 'bottom-center',
        });
        this.router.navigate(['/auth'])
      },
      error: (err: any) => {
        this.codeVerificationLoading.set(false);
        toast.success('Code does not match', {
          position: 'bottom-center',
        });
        console.log('verification failed', err);
      }
    });
  }

  handleGoogleSignIn() {
    this.authService.googleSignIn()
  }

  resendConfirmation() {

    const email = this.registerForm.value.email!;

    this.authService.resendConfirmation(email).subscribe({
      next: (response: any) => {
        toast.success('Code resent successfully', {
          position: 'bottom-center',
        });
      },
      error: (err: any) => {
        toast.success('Resending confirmation code failed', {
          position: 'bottom-center',
        });
        console.log('Resending Confirmation failed', err);
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  goToLogin() {
    this.router.navigate(['/auth'])
  }

  setUserTypeCustomer() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { type: 'customer' },
      queryParamsHandling: 'merge'
    });
  }

  setUserTypeMaker() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { type: 'maker' },
      queryParamsHandling: 'merge'
    });
  }

  setStepCredentials() {
    this.registerStep.set('credentials')
  }

  get userEmail() {
    return this.registerForm.value.email
  }
}
