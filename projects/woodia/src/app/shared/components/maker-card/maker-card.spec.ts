import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MakerCard } from './maker-card';

describe('MakerCard', () => {
  let component: MakerCard;
  let fixture: ComponentFixture<MakerCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MakerCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MakerCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
