import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServerDataTable } from './server-data-table';

describe('ServerDataTable', () => {
  let component: ServerDataTable;
  let fixture: ComponentFixture<ServerDataTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServerDataTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServerDataTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
