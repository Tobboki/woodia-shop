import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardDividerComponent } from '@shared/components/divider/divider.component';
import { ZardFormModule } from '@shared/components/form/form.module';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { ZardLoaderComponent } from '@shared/components/loader/loader.component';
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
    ZardLoaderComponent
  ],
  templateUrl: './shipping.html',
  styleUrl: './shipping.scss',
})
export class Shipping implements OnInit {
  constructor (
    private authService: AuthService,
    private settingsService: CustomerSettingsService,
  ) {}

  shippingDetailsLoading = signal<boolean>(true)
  shippingDetailsFormLoading = signal<boolean>(false)
  haveShippingDetails = signal<boolean>(true)
  shippingDetailsFormMode = signal<'add' | 'update'>('add')

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
            governorate: contactInfo.governate
          });

          this.shippingDetailsLoading.set(false)
          this.haveShippingDetails.set(true)
          this.shippingDetailsFormMode.set('update')
        },
        error: (err) => {
          if (err.status == '404' && err.error.errors.includes("ContactInformation.NotFound"))
            this.haveShippingDetails.set(false)

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
    if (this.shippingForm.invalid) {
      this.shippingForm.markAllAsTouched();
      return;
    }

    this.shippingDetailsFormLoading.set(true)

    const body = {
      phoneNumber: this.shippingForm.value.phone,
      governateId: this.shippingForm.value.governorate,
      addressLine: this.shippingForm.value.addressLine,
      additionalInfo: this.shippingForm.value.additionalDetails,
    };

    if(this.shippingDetailsFormMode() === 'add') {
      this.settingsService.createContactInfo(body)
      .subscribe({
        next: (res) => {
          this.shippingDetailsFormLoading.set(false)

          toast.success('shipping details added successful', {
            position: 'bottom-center',
          });

          this.shippingForm.markAsPristine()
        },
        error: (err) => {
          this.shippingDetailsFormLoading.set(false)

          toast.error('shipping detail add failed', {
            position: 'bottom-center',
          });

          console.log('shipping details add failed', err)
        },
      });
    } else {

      const request = this.settingsService.updateContactInfo(body).subscribe({
        next: (res) => {
          this.shippingDetailsFormLoading.set(false)

          toast.success('shipping details updated successful', {
            position: 'bottom-center',
          });

          this.shippingForm.markAsPristine()
        },
        error: (err) => {
          this.shippingDetailsFormLoading.set(false)

          toast.error('shipping details update failed', {
            position: 'bottom-center',
          });

          console.log('shipping details update failed', err)
        },
      });
    }
  }

  handleAddDetails() {
    this.haveShippingDetails.set(true)
  }
}
