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
export class Register implements OnInit {

  // Strongly typed registration form
  registerForm = new FormGroup({
    firstName: new FormControl<string>('', [Validators.required]),
    lastName: new FormControl<string>('', [Validators.required]),
    email: new FormControl<string>('', [Validators.required, Validators.email]),
    password: new FormControl<string>('', [Validators.required, Validators.minLength(8), passwordStrengthValidator()]),
    confirmPassword: new FormControl<string>('', [Validators.required]),
    agreeToTerms: new FormControl<boolean>(false),
  },{
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

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {}

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
          duration: 2000,
        });
        this.router.navigate(['/auth'])
      },
      error: (err: any) => {
        this.codeVerificationLoading.set(false);
        toast.success('Code does not match', {
          position: 'bottom-center',
          duration: 2000,
        });
        console.log('verification failed', err);
      }
    });
  }

  resendConfirmation() {

    const email = this.registerForm.value.email!;

    this.authService.resendConfirmation(email).subscribe({
      next: (response: any) => {
        toast.success('Code resent successfully', {
          position: 'bottom-center',
          duration: 2000,
        });
      },
      error: (err: any) => {
        toast.success('Resending confirmation code failed', {
          position: 'bottom-center',
          duration: 2000,
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
