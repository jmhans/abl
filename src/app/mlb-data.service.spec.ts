import { TestBed } from '@angular/core/testing';

import { MlbDataService } from './mlb-data.service';

describe('MlbDataService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MlbDataService = TestBed.get(MlbDataService);
    expect(service).toBeTruthy();
  });
});
