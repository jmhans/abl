import { TestBed } from '@angular/core/testing';

import { RosterFormService } from './roster-form.service';

describe('RosterFormService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RosterFormService = TestBed.get(RosterFormService);
    expect(service).toBeTruthy();
  });
});
