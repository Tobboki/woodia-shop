import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerJobOfferDetails } from './customer-job-offer-details';

describe('CustomerJobOfferDetails', () => {
  let component: CustomerJobOfferDetails;
  let fixture: ComponentFixture<CustomerJobOfferDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerJobOfferDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerJobOfferDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
