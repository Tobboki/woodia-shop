import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpandingCarousel } from './expanding-carousel';

describe('ExpandingCarousel', () => {
  let component: ExpandingCarousel;
  let fixture: ComponentFixture<ExpandingCarousel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpandingCarousel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpandingCarousel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
