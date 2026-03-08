import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CircularCarousel } from './circular-carousel';

describe('CircularCarousel', () => {
  let component: CircularCarousel;
  let fixture: ComponentFixture<CircularCarousel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CircularCarousel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CircularCarousel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
