import { TestBed } from '@angular/core/testing';

import { ChathubService } from './chathub.service';

describe('ChathubService', () => {
  let service: ChathubService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChathubService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
