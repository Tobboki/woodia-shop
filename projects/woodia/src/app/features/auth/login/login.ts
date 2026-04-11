import { AfterViewInit, Component, ElementRef, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, LoginCredentials } from '@woodia-core/services/auth.service';

import { ZardButtonComponent } from '@shared-components/button/button.component';
import { ZardInputDirective } from '@shared-components/input/input.directive';
import { ZardFormModule } from '@shared-components/form/form.module';
import { ZardCheckboxComponent } from '@shared-components/checkbox/checkbox.component';
import { ZardDividerComponent } from '@shared-components/divider/divider.component';
import { LogoComponent } from '@shared-components/custom/logo/logo.component';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { toast } from 'ngx-sonner';
import { ZardInputGroupComponent } from '@shared-components/input-group/input-group.component';
import { NgIcon } from '@ng-icons/core';

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
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login implements OnInit, AfterViewInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  @ViewChild('videoPlayer') videoRef!: ElementRef<HTMLVideoElement>;

  private nextVideoEl: HTMLVideoElement | null = null;
  videoLoading = signal<boolean>(true);

  // panels
  panels: string[] = [
    'https://res.cloudinary.com/drzda0ka9/video/upload/v1774013506/x7diii1amr8ixw2u0frn.mp4',
    'https://res.cloudinary.com/drzda0ka9/video/upload/v1774013395/kokhxqy7i3egvsncbktw.mp4',
    'https://res.cloudinary.com/drzda0ka9/video/upload/v1774013449/viw0aw1kf9n2vzpmhyq6.mp4',
    'https://res.cloudinary.com/drzda0ka9/video/upload/v1774013506/x7diii1amr8ixw2u0frn.mp4',
  ];

  currentIndex = 0;
  currentVideo = this.panels[this.currentIndex];

  ngAfterViewInit() {
    const video = this.videoRef.nativeElement;
    video.muted = true;
    video.play().catch(() => {});
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

    if (this.nextVideoEl) {
      video.src = this.nextVideoEl.src;
    } else {
      video.src = this.panels[this.currentIndex];
    }

    video.load();

    setTimeout(() => {
      video.play().catch(() => { });
    });

    this.preloadNext(this.currentIndex);
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
            toast.error('Access Denied', {
              description: 'Admins cannot login to the client app.',
              position: 'bottom-center',
            });
            return;
          }

          toast.success('Login Successful', {
            position: 'bottom-center',
            duration: 2000,
          });

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
            toast.error('Something went wrong', {
              description: 'There was a problem with your request.',
            });
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
