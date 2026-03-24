import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuideSection } from './guide-section';

describe('GuideSection', () => {
  let component: GuideSection;
  let fixture: ComponentFixture<GuideSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuideSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuideSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
