import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DesignConfigurator } from './design-configurator';

describe('DesignConfigurator', () => {
  let component: DesignConfigurator;
  let fixture: ComponentFixture<DesignConfigurator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DesignConfigurator]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DesignConfigurator);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
