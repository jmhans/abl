import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageRostersComponent } from './manage-rosters.component';

describe('ManageRostersComponent', () => {
  let component: ManageRostersComponent;
  let fixture: ComponentFixture<ManageRostersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManageRostersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageRostersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
