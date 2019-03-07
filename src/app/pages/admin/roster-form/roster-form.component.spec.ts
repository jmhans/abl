import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RosterFormComponent } from './roster-form.component';

describe('RosterFormComponent', () => {
  let component: RosterFormComponent;
  let fixture: ComponentFixture<RosterFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RosterFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RosterFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
