import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttachmentStaging } from './attachment-staging';

describe('AttachmentStaging', () => {
  let component: AttachmentStaging;
  let fixture: ComponentFixture<AttachmentStaging>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttachmentStaging]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AttachmentStaging);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
