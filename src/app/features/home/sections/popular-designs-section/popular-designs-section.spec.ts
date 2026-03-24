import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopularDesignsSection } from './popular-designs-section';

describe('PopularDesignsSection', () => {
  let component: PopularDesignsSection;
  let fixture: ComponentFixture<PopularDesignsSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopularDesignsSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopularDesignsSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
