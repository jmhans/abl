import { TestBed } from '@angular/core/testing';

import { LeagueConfigService } from './league-config.service';

describe('LeagueConfigService', () => {
  let service: LeagueConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LeagueConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
