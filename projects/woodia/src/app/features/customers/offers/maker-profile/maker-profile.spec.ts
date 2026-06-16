import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MakerProfile } from './maker-profile';

describe('MakerProfile', () => {
  let component: MakerProfile;
  let fixture: ComponentFixture<MakerProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MakerProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MakerProfile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
