import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DesignStudio } from './design-studio';

describe('DesignStudio', () => {
  let component: DesignStudio;
  let fixture: ComponentFixture<DesignStudio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DesignStudio]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DesignStudio);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
