import { TestBed } from '@angular/core/testing';

import { MakerPortfolioService } from './maker-portfolio.service';

describe('MakerPortfolioService', () => {
  let service: MakerPortfolioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MakerPortfolioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
