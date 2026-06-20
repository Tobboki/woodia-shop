import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoiceRecorder } from './voice-recorder';

describe('VoiceRecorder', () => {
  let component: VoiceRecorder;
  let fixture: ComponentFixture<VoiceRecorder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoiceRecorder]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VoiceRecorder);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
