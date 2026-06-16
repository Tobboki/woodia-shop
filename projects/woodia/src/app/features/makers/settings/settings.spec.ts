import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MakerSettings } from './settings';

describe('MakerSettings', () => {
  let component: MakerSettings;
  let fixture: ComponentFixture<MakerSettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MakerSettings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MakerSettings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
