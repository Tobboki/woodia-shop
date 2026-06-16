import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MakerOfferDetails } from './maker-offer-details';

describe('MakerOfferDetails', () => {
  let component: MakerOfferDetails;
  let fixture: ComponentFixture<MakerOfferDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MakerOfferDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MakerOfferDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
