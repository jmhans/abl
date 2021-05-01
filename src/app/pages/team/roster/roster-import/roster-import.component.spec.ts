import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RosterImportComponent } from './roster-import.component';

describe('RosterImportComponent', () => {
  let component: RosterImportComponent;
  let fixture: ComponentFixture<RosterImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RosterImportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RosterImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
