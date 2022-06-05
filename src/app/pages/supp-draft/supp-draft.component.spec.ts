import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuppDraftComponent } from './supp-draft.component';

describe('SuppDraftComponent', () => {
  let component: SuppDraftComponent;
  let fixture: ComponentFixture<SuppDraftComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuppDraftComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuppDraftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
