import { TestBed } from '@angular/core/testing';

import { CustomerOfferService } from './customer-offer.service';

describe('CustomerOfferService', () => {
  let service: CustomerOfferService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomerOfferService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
