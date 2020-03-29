import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerGameLineComponent } from './player-game-line.component';

describe('PlayerGameLineComponent', () => {
  let component: PlayerGameLineComponent;
  let fixture: ComponentFixture<PlayerGameLineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlayerGameLineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayerGameLineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
