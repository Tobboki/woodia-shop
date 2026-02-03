import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpandCarousel } from './expand-carousel';

describe('ExpandCarousel', () => {
  let component: ExpandCarousel;
  let fixture: ComponentFixture<ExpandCarousel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpandCarousel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpandCarousel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
