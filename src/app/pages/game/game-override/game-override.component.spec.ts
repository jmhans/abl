import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameOverrideComponent } from './game-override.component';

describe('GameOverrideComponent', () => {
  let component: GameOverrideComponent;
  let fixture: ComponentFixture<GameOverrideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GameOverrideComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GameOverrideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
