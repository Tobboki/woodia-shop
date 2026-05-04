import { AfterViewInit, Component, ElementRef, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, LoginCredentials } from '@woodia-core/services/auth.service';

import { ZardButtonComponent } from '@shared-components/button/button.component';
import { ZardInputDirective } from '@shared-components/input/input.directive';
import { ZardFormModule } from '@shared-components/form/form.module';
import { ZardCheckboxComponent } from '@shared-components/checkbox/checkbox.component';
import { ZardDividerComponent } from '@shared-components/divider/divider.component';
import { LogoComponent } from '@shared-components/custom/logo/logo.component';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { toast } from 'ngx-sonner';
import { ZardInputGroupComponent } from '@shared-components/input-group/input-group.component';
import { NgIcon } from '@ng-icons/core';
import {ZardSkeletonComponent} from '@shared-components/skeleton';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { NgOptimizedImage } from '@angular/common';


@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    ZardButtonComponent,
    ZardCheckboxComponent,
    NgIcon,
    ZardInputDirective,
    ZardDividerComponent,
    ZardFormModule,
    LogoComponent,
    ZardInputGroupComponent,
    ZardInputDirective,
    TranslocoDirective,
    NgOptimizedImage
  ],

  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login implements OnInit, AfterViewInit {
  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private translocoService: TranslocoService
  ) { }


  // Videos Panel
  @ViewChild('videoA') videoARef!: ElementRef<HTMLVideoElement>;
  @ViewChild('videoB') videoBRef!: ElementRef<HTMLVideoElement>;

  activeIndex = 0; // 0 = A visible, 1 = B visible
  currentIndex = 0;
  isInitialVideoLoading = signal(true);

  videoReady = signal<boolean>(false);

  panels: string[] = [
    'https://res.cloudinary.com/drzda0ka9/video/upload/v1774013506/x7diii1amr8ixw2u0frn.mp4',
    'https://res.cloudinary.com/drzda0ka9/video/upload/v1774013395/kokhxqy7i3egvsncbktw.mp4',
    'https://res.cloudinary.com/drzda0ka9/video/upload/v1774013449/viw0aw1kf9n2vzpmhyq6.mp4',
  ];

  ngAfterViewInit() {
    const videoA = this.videoARef.nativeElement;
    const videoB = this.videoBRef.nativeElement;

    videoA.onended = () => this.playNext();
    videoB.onended = () => this.playNext();

    videoA.src = this.panels[0];
    videoA.muted = true;

    videoA.oncanplaythrough = () => {
      this.isInitialVideoLoading.set(false);
      videoA.play().catch(() => {});
    };

    videoA.load();

    this.preloadNext();
  }

  preloadNext() {
    const nextIndex = (this.currentIndex + 1) % this.panels.length;
    const hiddenVideo = this.getHiddenVideo();

    hiddenVideo.src = this.panels[nextIndex];
    hiddenVideo.muted = true;
    hiddenVideo.playsInline = true;
    hiddenVideo.preload = 'auto';

    hiddenVideo.oncanplaythrough = () => {
      hiddenVideo.play().catch(() => {});
      this.videoReady.set(true);
    };

    hiddenVideo.load();
  }

  playNext() {
    if (!this.videoReady()) return;

    const currentVideo = this.getActiveVideo();
    const nextVideo = this.getHiddenVideo();

    // reset next video BEFORE showing it
    nextVideo.currentTime = 0;

    // ensure it's playing
    nextVideo.play().catch(() => {});

    // swap visibility
    this.activeIndex = this.activeIndex === 0 ? 1 : 0;

    this.currentIndex = (this.currentIndex + 1) % this.panels.length;
    this.videoReady.set(false);

    // delay pause for smooth crossfade
    setTimeout(() => {
      currentVideo.pause();
    }, 700);

    this.preloadNext();
  }

  getActiveVideo(): HTMLVideoElement {
    return this.activeIndex === 0
      ? this.videoARef.nativeElement
      : this.videoBRef.nativeElement;
  }

  getHiddenVideo(): HTMLVideoElement {
    return this.activeIndex === 0
      ? this.videoBRef.nativeElement
      : this.videoARef.nativeElement;
  }

  // Strongly typed form
  loginForm = new FormGroup({
    email: new FormControl<string>('', [Validators.required, Validators.email]),
    password: new FormControl<string>('', [Validators.required, Validators.minLength(8)]),
    rememberMe: new FormControl<boolean>(true)
  });

  get emailControl() {
    return this.loginForm.get('email')!;
  }

  get passwordControl() {
    return this.loginForm.get('password')!;
  }

  // Signal for password visibility
  showPassword = signal<boolean>(false);
  loginFormLoading = signal<boolean>(false);

  ngOnInit(): void {
    this.emailControl.valueChanges.subscribe(() => {
      this.clearBackendErrors();
    });

    this.passwordControl.valueChanges.subscribe(() => {
      this.clearBackendErrors();
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.loginFormLoading.set(true);

    const credentials: LoginCredentials = {
      email: this.loginForm.value.email!,
      password: this.loginForm.value.password!,
      rememberMe: this.loginForm.value.rememberMe!
    };

    this.authService.login(credentials)
      .pipe(
        finalize(() => this.loginFormLoading.set(false))
      )
      .subscribe({
        next: () => {
          this.loginFormLoading.set(false);

          const userType = this.authService.getCurrentUser()?.userType;

          if (userType?.toLowerCase() === 'admin') {
            this.authService.logout();
            toast.error(this.translocoService.translate('features.auth.login.errors.accessDenied'), {
              position: 'bottom-center',
            });
            return;
          }

          toast.success(this.translocoService.translate('features.auth.login.messages.loginSuccess'), {
            position: 'bottom-center',
            duration: 2000,
          });

          const returnUrl = this.route.snapshot.queryParams['returnUrl'];
          if (returnUrl) {
            this.router.navigateByUrl(returnUrl);
            return;
          }

          if (userType === 'Client') {
            this.router.navigate(['/customers']);
          }

        },
        error: (err) => {
          this.loginFormLoading.set(false)
          const errors = err.error?.errors || [];

          if (errors.includes('User.InvalidCredentials') || errors.includes('Invalid email/password')) {
            this.emailControl.setErrors({ backend: 'Invalid email or password' });

            this.passwordControl.setErrors({ backend: 'Invalid email or password' });
            this.passwordControl.markAsTouched();

            return;
          }

          else {
            toast.error(this.translocoService.translate('features.auth.login.errors.genericError'));
            console.log('login failed: ', err)
            this.passwordControl.markAsTouched();
          }
        }
      });
  }

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  goToLRegister() {
    this.router.navigate(['/auth/register'])
  }

  clearBackendErrors() {
    const emailErrors = this.emailControl.errors;
    const passErrors = this.passwordControl.errors;

    if (emailErrors && emailErrors['backend']) {
      delete emailErrors['backend'];
      this.emailControl.setErrors(Object.keys(emailErrors).length ? emailErrors : null);
    }

    if (passErrors && passErrors['backend']) {
      delete passErrors['backend'];
      this.passwordControl.setErrors(Object.keys(passErrors).length ? passErrors : null);
    }
  }

  handleGoogleSignIn() {
    this.authService.googleSignIn()
  }
}
