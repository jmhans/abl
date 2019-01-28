import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RosterDetailsComponent } from './roster-details.component';

describe('RosterDetailsComponent', () => {
  let component: RosterDetailsComponent;
  let fixture: ComponentFixture<RosterDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RosterDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RosterDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
