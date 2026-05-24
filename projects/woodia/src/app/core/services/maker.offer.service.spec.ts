import { TestBed } from '@angular/core/testing';

import { MakerOfferService } from './maker.offer.service';

describe('MakerOfferService', () => {
  let service: MakerOfferService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MakerOfferService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
