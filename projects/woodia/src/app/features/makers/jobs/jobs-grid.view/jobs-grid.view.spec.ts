import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobsGridView } from './jobs-grid.view';

describe('JobsGridView', () => {
  let component: JobsGridView;
  let fixture: ComponentFixture<JobsGridView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobsGridView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobsGridView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
