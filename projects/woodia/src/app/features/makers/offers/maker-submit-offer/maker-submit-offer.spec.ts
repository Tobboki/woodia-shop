import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MakerOffer } from './maker-submit-offer';

describe('MakerOffer', () => {
  let component: MakerOffer;
  let fixture: ComponentFixture<MakerOffer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MakerOffer]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MakerOffer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
