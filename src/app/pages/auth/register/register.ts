import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, IEmailVerificationData } from '@shared/services/auth';
import { Router } from '@angular/router';

import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { ZardFormModule } from '@shared/components/form/form.module';
import { ZardCheckboxComponent } from '@shared/components/checkbox/checkbox.component';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import { ZardDividerComponent } from '@shared/components/divider/divider.component';
import { LogoComponent } from '@shared/components/logo/logo.component';

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
export class Register implements OnInit {

  // Strongly typed registration form
  registerForm = new FormGroup({
    firstName: new FormControl<string>('', [Validators.required]),
    lastName: new FormControl<string>('', [Validators.required]),
    email: new FormControl<string>('', [Validators.required, Validators.email]),
    password: new FormControl<string>('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl<string>('', [Validators.required, Validators.minLength(8)]),
    agreeToTerms: new FormControl<boolean>(false),
  });

  emailVerificationForm = new FormGroup({
    code: new FormControl<string>('', [Validators.required, Validators.minLength(6)])
  })

  // Signals
  registerStep = signal<'userType' | 'credentials' | 'verification'>('userType');
  userType = signal<'customer' | 'maker'>('customer');
  showPassword = signal<boolean>(false);
  showConfirmPassword = signal<boolean>(false);
  apiError = signal<string | null>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  handleCredentialsSubmit() {
    if (this.registerForm.invalid) return;

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
        console.log('register successful', response);
        this.apiError.set(null);
        this.registerStep.set('verification')
      },
      error: (err) => {
        console.log('register failed', err);
        this.apiError.set('Registration failed. Please try again.');
      }
    });
  }

  handleVerificationSubmit() {
    if (this.registerForm.invalid) return;

    const verificationData: IEmailVerificationData = {
      email: this.registerForm.value.email!,
      code: this.emailVerificationForm.value.code!,
    };

    this.authService.confirmEmail(verificationData).subscribe({
      next: (response: any) => {
        console.log('verification successful', response);
        this.apiError.set(null);
        this.router.navigate(['/auth'])
      },
      error: (err: any) => {
        console.log('verification failed', err);
        this.apiError.set('Verification failed. Please try again.');
      }
    });
  }

  resendConfirmation() {

    const email = this.registerForm.value.email!;

    this.authService.resendConfirmation(email).subscribe({
      next: (response: any) => {
        console.log('Sent successfully', response);
        this.apiError.set(null);
      },
      error: (err: any) => {
        console.log('Resending Confirmation failed', err);
        this.apiError.set('Verification failed. Please try again.');
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
    this.userType.set('customer')
  }

  setUserTypeMaker() {
    this.userType.set('maker')
  }

  setStepCredentials() {
    this.registerStep.set('credentials')
  }

  get userEmail() {
    return this.registerForm.value.email
  }
}
