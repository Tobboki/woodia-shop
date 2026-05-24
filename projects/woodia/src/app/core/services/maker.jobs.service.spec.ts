import { TestBed } from '@angular/core/testing';

import { MakerJobsService } from './maker.jobs.service';

describe('MakerJobsService', () => {
  let service: MakerJobsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MakerJobsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
