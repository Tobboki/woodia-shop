import { Component, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ZardButtonComponent } from '@shared-components/button/button.component';
import { ZardDividerComponent } from '@shared-components/divider/divider.component';
import { ZardFormModule } from '@shared-components/form/form.module';
import { ZardInputDirective } from '@shared-components/input/input.directive';
import { ZardSkeletonComponent } from '@shared-components/skeleton/skeleton.component';
import { ZardSelectItemComponent } from '@shared-components/select/select-item.component';
import { ZardSelectComponent } from '@shared-components/select/select.component';
import { MakerService, IContactInfo } from '@woodia-core/services/maker.service';
import { ConstantsService, IGovernorate } from '@woodia-core/services/constants.service';
import { toast } from 'ngx-sonner';
import { TranslocoDirective, TranslocoService, TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'woodia-maker-contact-info',
  imports: [
    ReactiveFormsModule,
    ZardDividerComponent,
    ZardInputDirective,
    ZardFormModule,
    ZardButtonComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardSkeletonComponent,
    TranslocoDirective,
    TranslocoPipe
  ],
  templateUrl: './contact-info.html',
  styleUrl: './contact-info.scss',
})
export class ContactInfo implements OnInit {
  constructor(
    private makerService: MakerService,
    private constantsService: ConstantsService,
    private translocoService: TranslocoService
  ) { }

  contactInfoLoading = signal<boolean>(true);
  contactInfoFormLoading = signal<boolean>(false);
  haveContactInfo = signal<boolean>(true);
  contactInfoFormMode = signal<'add' | 'update'>('add');
  Governorates = signal<IGovernorate[]>([]);

  // Keep a local copy of loaded data for reset functionality
  private initialContactData: IContactInfo | null = null;

  get phoneControl() {
    return this.contactForm.get('phone') as FormControl;
  }

  get governorateControl() {
    return this.contactForm.get('governorate') as FormControl;
  }

  get addressLineControl() {
    return this.contactForm.get('addressLine') as FormControl;
  }

  get additionalDetailsControl() {
    return this.contactForm.get('additionalDetails') as FormControl;
  }

  contactForm = new FormGroup({
    phone: new FormControl<string>('', [
      Validators.required,
      Validators.pattern(/^[0-9+]{10,15}$/)
    ]),
    governorate: new FormControl<string>('', [Validators.required]),
    addressLine: new FormControl<string>('', [
      Validators.required,
      Validators.minLength(5)
    ]),
    additionalDetails: new FormControl<string>('', [
      Validators.minLength(5)
    ]),
  });

  ngOnInit(): void {
    this.constantsService.getGovernorates().subscribe({
      next: (governorates) => {
        this.Governorates.set(governorates);
      },
      error: (err) => {
        console.error('Error fetching governorates', err);
      },
    });

    this.makerService.getContactInfo().subscribe({
      next: (contactInfo) => {
        this.initialContactData = contactInfo;
        this.contactForm.patchValue({
          phone: contactInfo.phoneNumber,
          addressLine: contactInfo.addressLine,
          additionalDetails: contactInfo.additionalInfo,
          governorate: contactInfo.governateId ? contactInfo.governateId.toString() : ''
        });

        this.contactInfoLoading.set(false);
        this.haveContactInfo.set(true);
        this.contactInfoFormMode.set('update');
      },
      error: (err) => {
        if (err.status === 404 || (err.error?.errors && err.error.errors.includes('ContactInformation.NotFound'))) {
          this.haveContactInfo.set(false);
        }

        this.contactInfoLoading.set(false);
        console.error('Error fetching contact info', err);
      },
    });
  }

  handleContactSubmit() {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.contactInfoFormLoading.set(true);

    const body: IContactInfo = {
      phoneNumber: this.contactForm.value.phone!,
      governateId: Number(this.contactForm.value.governorate!),
      addressLine: this.contactForm.value.addressLine!,
      additionalInfo: this.contactForm.value.additionalDetails!,
    };

    if (this.contactInfoFormMode() === 'add') {
      this.makerService.createContactInfo(body).subscribe({
        next: () => {
          this.contactInfoFormLoading.set(false);
          this.initialContactData = body;
          this.contactInfoFormMode.set('update');

          toast.success(this.translocoService.translate('features.makers.settings.messages.addSuccess'), {
            position: 'bottom-center',
          });

          this.contactForm.markAsPristine();
        },
        error: (err) => {
          this.contactInfoFormLoading.set(false);

          toast.error(this.translocoService.translate('features.makers.settings.errors.addFailed'), {
            position: 'bottom-center',
          });

          console.error('Contact details add failed', err);
        },
      });
    } else {
      this.makerService.updateContactInfo(body).subscribe({
        next: () => {
          this.contactInfoFormLoading.set(false);
          this.initialContactData = body;

          toast.success(this.translocoService.translate('features.makers.settings.messages.updateSuccess'), {
            position: 'bottom-center',
          });

          this.contactForm.markAsPristine();
        },
        error: (err) => {
          this.contactInfoFormLoading.set(false);

          toast.error(this.translocoService.translate('features.makers.settings.errors.updateFailed'), {
            position: 'bottom-center',
          });

          console.error('Contact details update failed', err);
        },
      });
    }
  }

  handleAddDetails() {
    this.haveContactInfo.set(true);
  }

  resetForm() {
    if (this.initialContactData) {
      this.contactForm.patchValue({
        phone: this.initialContactData.phoneNumber,
        addressLine: this.initialContactData.addressLine,
        additionalDetails: this.initialContactData.additionalInfo,
        governorate: this.initialContactData.governateId ? this.initialContactData.governateId.toString() : ''
      });
      this.contactForm.markAsPristine();
    } else {
      this.contactForm.reset();
    }
  }
}
