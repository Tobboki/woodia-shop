import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MakerJobs } from './maker-jobs';

describe('MakerJobs', () => {
  let component: MakerJobs;
  let fixture: ComponentFixture<MakerJobs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MakerJobs]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MakerJobs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
