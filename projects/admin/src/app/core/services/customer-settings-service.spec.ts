import { TestBed } from '@angular/core/testing';

import { CustomerSettingsService } from './customer-settings-service';

describe('CustomerSettingsService', () => {
  let service: CustomerSettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomerSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
