import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MakersSection } from './makers-section';

describe('MakersSection', () => {
  let component: MakersSection;
  let fixture: ComponentFixture<MakersSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MakersSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MakersSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
