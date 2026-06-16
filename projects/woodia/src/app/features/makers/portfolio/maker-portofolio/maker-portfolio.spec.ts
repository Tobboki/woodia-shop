import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MakerPortfolio } from './maker-portfolio';

describe('MakerPortfolio', () => {
  let component: MakerPortfolio;
  let fixture: ComponentFixture<MakerPortfolio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MakerPortfolio]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MakerPortfolio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
