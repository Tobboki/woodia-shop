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

  // Strongly typed form
  loginForm = new FormGroup({
    email: new FormControl<string>('', [Validators.required, Validators.email]),
    password: new FormControl<string>('', [Validators.required, Validators.minLength(8)]),
    rememberMe: new FormControl<boolean>(true)
  });

  // Signal for password visibility
  showPassword = signal<boolean>(false);

  apiError = signal<string | null>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  onSubmit() {
    if (this.loginForm.invalid) return;

    const credentials: LoginCredentials = {
      email: this.loginForm.value.email!,
      password: this.loginForm.value.password!,
      rememberMe: this.loginForm.value.rememberMe!
    };

    // 🔥 MUST SUBSCRIBE to trigger login
    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.apiError.set(null);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.apiError.set('Invalid email or password');
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  goToLRegister() {
    this.router.navigate(['/auth/register'])
  }
}
