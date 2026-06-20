import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudioMessage } from './audio-message';

describe('AudioMessage', () => {
  let component: AudioMessage;
  let fixture: ComponentFixture<AudioMessage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AudioMessage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AudioMessage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
