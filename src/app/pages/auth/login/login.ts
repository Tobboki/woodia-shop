import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, LoginCredentials } from '@shared/services/auth';

import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardInputDirective } from '../../../shared/components/input/input.directive';
import { ZardFormModule } from '../../../shared/components/form/form.module';
import { ZardCheckboxComponent } from '../../../shared/components/checkbox/checkbox.component';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import { ZardDividerComponent } from '@shared/components/divider/divider.component';
import { LogoComponent } from '@shared/components/logo/logo.component';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    ZardButtonComponent,
    ZardCheckboxComponent,
    ZardIconComponent,
    ZardInputDirective,
    ZardDividerComponent,
    ZardFormModule,
    LogoComponent
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

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
      next: (response) => {
        this.loginFormLoading.set(false)
        this.router.navigate(['/']);
        toast.success('Login Successful', {
          position: 'bottom-center',
          duration: 2000,
        });
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
