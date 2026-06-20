import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatShell } from './chat-shell';

describe('ChatShell', () => {
  let component: ChatShell;
  let fixture: ComponentFixture<ChatShell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatShell]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatShell);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
