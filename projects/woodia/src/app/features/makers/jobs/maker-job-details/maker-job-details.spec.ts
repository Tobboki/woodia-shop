import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MakerJobDetails } from './maker-job-details';

describe('MakerJobDetails', () => {
  let component: MakerJobDetails;
  let fixture: ComponentFixture<MakerJobDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MakerJobDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MakerJobDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
