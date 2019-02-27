import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AblAdminComponent } from './abl-admin.component';

describe('AblAdminComponent', () => {
  let component: AblAdminComponent;
  let fixture: ComponentFixture<AblAdminComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AblAdminComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AblAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
