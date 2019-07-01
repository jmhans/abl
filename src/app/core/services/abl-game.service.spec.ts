import { TestBed } from '@angular/core/testing';

import { AblGameService } from './abl-game.service';

describe('AblGameService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AblGameService = TestBed.get(AblGameService);
    expect(service).toBeTruthy();
  });
});
