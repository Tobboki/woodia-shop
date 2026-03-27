import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OurStory } from './our-story';

describe('OurStory', () => {
  let component: OurStory;
  let fixture: ComponentFixture<OurStory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OurStory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OurStory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
