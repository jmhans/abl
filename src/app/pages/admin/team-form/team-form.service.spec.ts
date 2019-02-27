import { TestBed } from '@angular/core/testing';

import { TeamFormService } from './team-form.service';

describe('TeamFormService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TeamFormService = TestBed.get(TeamFormService);
    expect(service).toBeTruthy();
  });
});
