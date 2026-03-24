import { AfterViewInit, Component, ElementRef, OnInit, signal, ViewChild } from '@angular/core';
import {CommonModule} from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, IEmailVerificationData } from '@core/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { ZardFormModule } from '@shared/components/form/form.module';
import { ZardCheckboxComponent } from '@shared/components/checkbox/checkbox.component';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import { ZardDividerComponent } from '@shared/components/divider/divider.component';
import { LogoComponent } from '@shared/components/custom/logo/logo.component';
import { matchPasswordsValidator } from '@shared/validators/match-password-validator';
import { passwordStrengthValidator } from '@shared/validators/password-strength-validator';
import { toast } from 'ngx-sonner';
import {ZardInputGroupComponent} from '@shared/components/input-group/input-group.component';

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
    LogoComponent,
    ZardInputGroupComponent,
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

  private nextVideoEl: HTMLVideoElement | null = null;

  // panels
  customerPanels: string[] = [
    // customer panel 1
    'https://res.cloudinary.com/drzda0ka9/video/upload/v1774013506/x7diii1amr8ixw2u0frn.mp4',
    // customer panel 2
    'https://res.cloudinary.com/drzda0ka9/video/upload/v1774013395/kokhxqy7i3egvsncbktw.mp4',
    // customer panel 3
    'https://res.cloudinary.com/drzda0ka9/video/upload/v1774013449/viw0aw1kf9n2vzpmhyq6.mp4',
    // customer panel 4
    'https://res.cloudinary.com/drzda0ka9/video/upload/v1774013506/x7diii1amr8ixw2u0frn.mp4',
  ];

  makerPanels: string[] = [
    // maker panel 1
    'https://res.cloudinary.com/drzda0ka9/video/upload/v1774012483/m8kgkciim9iqwb9da117.mp4',
    // maker panel 2
    'https://res.cloudinary.com/drzda0ka9/video/upload/v1774012534/jf8br5q65lgfn64qlw19.mp4',
    // maker panel 3
    'https://res.cloudinary.com/drzda0ka9/video/upload/v1774012391/owlfq6psbs6khcqlewjw.mp4',
    // maker panel 4
    'https://res.cloudinary.com/drzda0ka9/video/upload/v1774012289/rgazeknddzjxahyahi5a.mp4',
  ];

  panels: string[] = [];

  currentIndex = 0;
  currentVideo = this.panels[this.currentIndex];

  ngAfterViewInit() {
    const video = this.videoRef.nativeElement;
    video.muted = true;
    video.play().catch(() => { });
  }

  preloadNext(index: number) {
    const nextIndex = (index + 1) % this.panels.length;

    const vid = document.createElement('video');
    vid.src = this.panels[nextIndex];
    vid.preload = 'auto';
    vid.muted = true;

    vid.load();

    this.nextVideoEl = vid;
  }

  playNext() {
    this.currentIndex = (this.currentIndex + 1) % this.panels.length;

    const video = this.videoRef.nativeElement;

    // 👇 use preloaded video if available
    if (this.nextVideoEl) {
      video.src = this.nextVideoEl.src;
    } else {
      video.src = this.panels[this.currentIndex];
    }

    video.load();

    setTimeout(() => {
      video.play().catch(() => {});
    });

    // 🔥 preload next again
    this.preloadNext(this.currentIndex);
  }

  resetVideoLoop() {
    this.currentIndex = 0;
    this.currentVideo = this.panels[0];

    const video = this.videoRef?.nativeElement;
    if (video) {
      video.pause();
      video.src = this.currentVideo;
      video.load();

      setTimeout(() => {
        video.play().catch(() => {});
      });
    }

    this.preloadNext(this.currentIndex);
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
