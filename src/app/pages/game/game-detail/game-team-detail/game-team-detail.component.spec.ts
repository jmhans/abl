import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameTeamDetailComponent } from './game-team-detail.component';

describe('GameTeamDetailComponent', () => {
  let component: GameTeamDetailComponent;
  let fixture: ComponentFixture<GameTeamDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GameTeamDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GameTeamDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
