import { TestBed } from '@angular/core/testing';

import { GameFormService } from './game-form.service';

describe('GameFormService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GameFormService = TestBed.get(GameFormService);
    expect(service).toBeTruthy();
  });
});
