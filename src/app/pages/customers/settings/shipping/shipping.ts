import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardDividerComponent } from '@shared/components/divider/divider.component';
import { ZardFormModule } from '@shared/components/form/form.module';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { ZardSelectItemComponent } from '@shared/components/select/select-item.component';
import { ZardSelectComponent } from '@shared/components/select/select.component';
import { AuthService } from '@shared/services/auth';
import { CustomerSettingsService } from '@shared/services/customer-settings-service';
import { toast } from 'ngx-sonner';

interface IGovernorate {
  id: number
  nameEn: string
  nameAr: string
}

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
export class Shipping implements OnInit {
  constructor (
    private authService: AuthService,
    private settingsService: CustomerSettingsService,
  ) {}

  shippingDetailsLoading = signal(true)
  haveShippingDetails = signal(false)

  ngOnInit(): void {
    this.settingsService.getGovernorate().subscribe({
      next: (governorates) => {
          this.Governorates.set(governorates)

        },
        error: (err) => {
          console.error('Error fetching governorates', err)
        },
    });

    this.settingsService.getContactInfo().subscribe({
      next: (contactInfo) => {
          this.shippingForm.patchValue({
            phone: contactInfo.phoneNumber,
            addressLine: contactInfo.addressLine,
            additionalDetails: contactInfo.additionalInfo,
          });

          this.shippingDetailsLoading.set(false)
          this.haveShippingDetails.set(true)
        },
        error: (err) => {
          this.shippingDetailsLoading.set(false)

          console.error('Error fetching shipping data', err)
        },
    });
  }

  Governorates = signal<IGovernorate[]>([])

  shippingForm = new FormGroup({
    phone: new FormControl<string>('', [Validators.required]),
    governorate: new FormControl<string>('', [Validators.required]),
    addressLine: new FormControl<string>('', [Validators.required]),
    additionalDetails: new FormControl<string>('', [Validators.required]),
  });

  handleShippingSubmit() {

  }
}
