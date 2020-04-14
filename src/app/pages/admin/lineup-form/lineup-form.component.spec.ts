import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LineupFormComponent } from './lineup-form.component';

describe('LineupFormComponent', () => {
  let component: LineupFormComponent;
  let fixture: ComponentFixture<LineupFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LineupFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LineupFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
