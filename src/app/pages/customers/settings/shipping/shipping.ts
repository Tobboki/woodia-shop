import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardDividerComponent } from '@shared/components/divider/divider.component';
import { ZardFormModule } from '@shared/components/form/form.module';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { ZardSelectItemComponent } from '@shared/components/select/select-item.component';
import { ZardSelectComponent } from '@shared/components/select/select.component';

@Component({
  selector: 'woodia-shipping',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ZardDividerComponent,
    ZardInputDirective,
    ZardFormModule,
    ZardButtonComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
  ],
  templateUrl: './shipping.html',
  styleUrl: './shipping.scss',
})
export class Shipping {
  readonly countries = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'au', label: 'Australia' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
    { value: 'jp', label: 'Japan' },
    { value: 'br', label: 'Brazil' },
  ] as const;

   shippingForm = new FormGroup({
    phone: new FormControl<string>('', [Validators.required]),
    governorate: new FormControl<string>('', [Validators.required]),
    addressLine: new FormControl<string>('', [Validators.required]),
    additionalDetails: new FormControl<string>('', [Validators.required]),
  });

  handleShippingSubmit() {

  }
}
