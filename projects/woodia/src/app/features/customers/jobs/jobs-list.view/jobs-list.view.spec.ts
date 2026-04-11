import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobsListView } from './jobs-list.view';

describe('JobsListView', () => {
  let component: JobsListView;
  let fixture: ComponentFixture<JobsListView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobsListView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobsListView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
