import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerJobOffers } from './customer-job-offers';

describe('CustomerJobOffers', () => {
  let component: CustomerJobOffers;
  let fixture: ComponentFixture<CustomerJobOffers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerJobOffers]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CustomerJobOffers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
