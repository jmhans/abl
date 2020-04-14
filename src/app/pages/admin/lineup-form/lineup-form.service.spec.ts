import { TestBed } from '@angular/core/testing';

import { LineupFormService } from './lineup-form.service';

describe('LineupFormService', () => {
  let service: LineupFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LineupFormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
