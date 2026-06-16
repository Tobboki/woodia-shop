import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MakerOffers } from './maker-offers';

describe('MakerOffers', () => {
  let component: MakerOffers;
  let fixture: ComponentFixture<MakerOffers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MakerOffers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MakerOffers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
