import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardDividerComponent } from '@shared/components/divider/divider.component';
import { ZardFormModule } from '@shared/components/form/form.module';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';

@Component({
  selector: 'woodia-account',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ZardDividerComponent,
    ZardInputDirective,
    ZardFormModule,
    ZardButtonComponent,
  ],
  templateUrl: './account.html',
  styleUrl: './account.scss',
})
export class Account {
  infoForm = new FormGroup({
    firstName: new FormControl<string>('', [Validators.required]),
    lastName: new FormControl<string>('', [Validators.required]),
  });

  emailForm = new FormGroup({
    email: new FormControl<string>('', [Validators.required, Validators.email]),
  });

  passwordForm = new FormGroup({
    password: new FormControl<string>('', [Validators.required, Validators.minLength(8)]),
  });

  handleInfoSubmit() {

  }

  handleEmailChange() {

  }

  handlePasswordChange() {

  }
}
