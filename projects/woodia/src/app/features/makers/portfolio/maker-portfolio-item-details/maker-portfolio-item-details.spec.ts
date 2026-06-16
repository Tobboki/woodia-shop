import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MakerPortfolioItemDetails } from './maker-portfolio-item-details';

describe('MakerPortfolioItemDetails', () => {
  let component: MakerPortfolioItemDetails;
  let fixture: ComponentFixture<MakerPortfolioItemDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MakerPortfolioItemDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MakerPortfolioItemDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
